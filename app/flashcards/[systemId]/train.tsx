import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, PanResponder, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import type { User } from "@supabase/supabase-js";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import { buildChoices, buildQueue, classifySwipe, gradeAnswer, nextProgress, type DrillCard, type DrillConfig, type DrillDirection, type DrillMode, type DrillOrder, type GradeResult } from "../../../components/flashcards/drillEngine";
import { loadDrillPreferences, saveDrillPreferences } from "../../../components/flashcards/paoPreferences";
import { calculatePaoStats, loadPaoSystem, savePaoProgress } from "../../../components/flashcards/paoStore";
import type { PaoSystemBundle, PegProgress } from "../../../components/flashcards/paoTypes";
import { saveGameResult } from "../../../components/games/resultsStore";
import { FLASHCARD_ACCENT, flashcards as s } from "../../../styles/screens/flashcards.styles";

type Phase = "setup" | "play" | "results";
type DirectionChoice = "key-fields" | "fields-key" | "field-field";
type ScopeChoice = "all" | "weak" | "starred" | "range";
type Outcome = { card: DrillCard; correct: boolean; fieldResults: GradeResult[]; elapsedMs: number };

export default function FlashcardTrainScreen() {
  const { systemId, itemKey } = useLocalSearchParams<{ systemId: string; itemKey?: string }>();
  return (
    <DashboardShell active="flashcards" lightHeader showPageHeader={false} pinFooter title="Flashcard training" subtitle="Focused recall training.">
      {({ user, isMobile }) => <TrainExperience user={user} systemId={systemId} itemKey={itemKey} isMobile={isMobile} />}
    </DashboardShell>
  );
}

function TrainExperience({ user, systemId, itemKey, isMobile }: { user: User | null; systemId: string; itemKey?: string; isMobile: boolean }) {
  const [bundle, setBundle] = useState<PaoSystemBundle | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<DrillMode>("flip");
  const [order, setOrder] = useState<DrillOrder>("smart");
  const [directionChoice, setDirectionChoice] = useState<DirectionChoice>("key-fields");
  const [scopeChoice, setScopeChoice] = useState<ScopeChoice>(itemKey ? "range" : "all");
  const [rangeFrom, setRangeFrom] = useState(itemKey ?? "00");
  const [rangeTo, setRangeTo] = useState(itemKey ?? "99");
  const [length, setLength] = useState<number | "all">(itemKey ? 1 : 25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [audio, setAudio] = useState(false);
  const [queue, setQueue] = useState<DrillCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<GradeResult[] | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [sessionProgress, setSessionProgress] = useState<PegProgress[]>([]);
  const [sessionMasteryBefore, setSessionMasteryBefore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cardStartedAt = useRef(Date.now());
  const sessionStartedAt = useRef(Date.now());
  const finishingRef = useRef(false);
  const swipeX = useRef(new Animated.Value(0)).current;
  const suppressCardTapRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    loadPaoSystem(user.id, systemId)
      .then(async (next) => {
        setBundle(next);
        setSessionProgress(next.progress);
        const saved = await loadDrillPreferences(systemId);
        if (saved?.mode) setMode(saved.mode);
        if (saved?.order) setOrder(saved.order);
        if (saved?.length) setLength(saved.length);
        if (saved?.timerSeconds) setTimerSeconds(saved.timerSeconds);
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Training could not be opened."));
  }, [systemId, user]);

  const direction = useMemo<DrillDirection>(() => {
    const fields = bundle?.system.fields ?? [];
    if (directionChoice === "fields-key") return { from: "fields", to: "key" };
    if (directionChoice === "field-field") {
      const from = fields[0]?.id ?? "person";
      return { from, to: fields.slice(1).map((field) => field.id) };
    }
    return { from: "key", to: fields.map((field) => field.id) };
  }, [bundle, directionChoice]);

  const config = useMemo<DrillConfig>(() => ({
    systemId,
    direction,
    mode,
    order,
    scope: scopeChoice === "range" ? { kind: "range", from: rangeFrom, to: rangeTo } : { kind: scopeChoice },
    length,
    timerSeconds: timerSeconds || undefined,
  }), [direction, length, mode, order, rangeFrom, rangeTo, scopeChoice, systemId, timerSeconds]);

  const current = queue[index];
  const choices = useMemo(() => current && bundle ? buildChoices(current, bundle.items) : [], [bundle, current]);

  useEffect(() => {
    if (phase !== "play" || !current || !audio) return;
    Speech.stop();
    Speech.speak(current.prompt, { rate: 0.85 });
    return () => { void Speech.stop(); };
  }, [audio, current, phase]);

  const finishSession = useCallback(async (nextOutcomes: Outcome[], nextProgress: PegProgress[]) => {
    if (!bundle || finishingRef.current) return;
    finishingRef.current = true;
    setSaving(true);
    setPhase("results");
    setBundle((currentBundle) => currentBundle ? { ...currentBundle, progress: nextProgress } : currentBundle);
    const correctCards = nextOutcomes.filter((outcome) => outcome.correct).length;
    const fieldResults = nextOutcomes.flatMap((outcome) => outcome.fieldResults);
    const correctFields = fieldResults.filter((result) => result.verdict !== "wrong").length;
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 1000));
    try {
      await savePaoProgress(nextProgress);
      await saveGameResult({
        id: `pao-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        gameId: "pao-flashcards",
        gameTitle: `${bundle.system.name} — ${directionLabel(direction, bundle.system.fields.map((field) => field.label))}`,
        createdAt: new Date().toISOString(),
        mode: mode === "flip" ? "manual" : "auto",
        exerciseSeconds: elapsedSeconds,
        timeTakenSeconds: elapsedSeconds,
        numbersShown: nextOutcomes.length,
        numbersCorrect: correctCards,
        digitsShown: fieldResults.length,
        digitsCorrect: correctFields,
        accuracy: fieldResults.length ? Math.round((correctFields / fieldResults.length) * 100) : 0,
        settings: {
          digits: fieldResults.length,
          min: 0,
          max: bundle.system.expectedSize - 1,
          systemId,
          kind: bundle.system.kind,
          mode,
          direction: directionChoice,
          targets: directionLabel(direction, bundle.system.fields.map((field) => field.label)),
          scope: scopeChoice,
          order,
          timerSeconds,
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The session could not be saved.");
    } finally {
      finishingRef.current = false;
      setSaving(false);
    }
  }, [bundle, direction, directionChoice, mode, order, scopeChoice, systemId, timerSeconds]);

  const recordResult = useCallback((results: GradeResult[]) => {
    if (!current || finishingRef.current) return;
    const elapsedMs = Math.max(1, Date.now() - cardStartedAt.current);
    const correct = results.every((result) => result.verdict !== "wrong");
    const progressMap = new Map(sessionProgress.map((entry) => [`${entry.itemId}:${entry.field}`, entry]));
    current.targets.forEach((target, targetIndex) => {
      const key = `${current.item.id}:${target.field}`;
      progressMap.set(key, nextProgress(progressMap.get(key), results[targetIndex] ?? { verdict: "wrong", expectedDisplay: target.expected }, elapsedMs, current.item.id, target.field));
    });
    const nextProgressRows = [...progressMap.values()];
    const nextOutcomes = [...outcomes, { card: current, correct, fieldResults: results, elapsedMs }];
    setSessionProgress(nextProgressRows);
    setOutcomes(nextOutcomes);
    if (index >= queue.length - 1) {
      void finishSession(nextOutcomes, nextProgressRows);
      return;
    }
    setIndex((value) => value + 1);
    setRevealed(false);
    setAnswers({});
    setFeedback(null);
    setSecondsLeft(timerSeconds);
    cardStartedAt.current = Date.now();
  }, [current, finishSession, index, outcomes, queue.length, sessionProgress, timerSeconds]);

  const gradeSwipe = useCallback((grade: "poor" | "good") => {
    if (!current) return;
    recordResult(current.targets.map((target) => ({
      verdict: grade === "good" ? "correct" : "wrong",
      expectedDisplay: target.expected,
    })));
  }, [current, recordResult]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => mode === "flip"
      && Math.abs(gesture.dx) > 8
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderGrant: () => { suppressCardTapRef.current = true; },
    onPanResponderMove: (_, gesture) => swipeX.setValue(gesture.dx),
    onPanResponderRelease: (_, gesture) => {
      const grade = classifySwipe(gesture.dx);
      if (grade) {
        swipeX.setValue(0);
        gradeSwipe(grade);
        setTimeout(() => { suppressCardTapRef.current = false; }, 0);
        return;
      }
      Animated.spring(swipeX, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }).start();
      setTimeout(() => { suppressCardTapRef.current = false; }, 0);
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeX, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }).start();
      setTimeout(() => { suppressCardTapRef.current = false; }, 0);
    },
  }), [gradeSwipe, mode, swipeX]);

  useEffect(() => {
    swipeX.stopAnimation();
    swipeX.setValue(0);
  }, [current?.id, mode, swipeX]);

  useEffect(() => {
    if (phase !== "play" || !current || !timerSeconds || feedback) return;
    if (secondsLeft <= 0) {
      recordResult(current.targets.map((target) => ({ verdict: "wrong", expectedDisplay: target.expected })));
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [current, feedback, phase, recordResult, secondsLeft, timerSeconds]);

  function startSession(onlyKeys?: string[]) {
    if (!bundle) return;
    let sourceItems = bundle.items;
    if (itemKey) sourceItems = sourceItems.filter((item) => item.key === itemKey);
    if (onlyKeys?.length) sourceItems = sourceItems.filter((item) => onlyKeys.includes(item.key));
    const nextQueue = buildQueue(sourceItems, bundle.progress, { ...config, length: onlyKeys?.length ? "all" : config.length }, bundle.system.fields);
    if (!nextQueue.length) {
      setError("No pegs match those settings. Try All pegs or widen the range.");
      return;
    }
    void saveDrillPreferences(config);
    setQueue(nextQueue);
    setIndex(0);
    setOutcomes([]);
    setSessionProgress(bundle.progress);
    setSessionMasteryBefore(calculatePaoStats(bundle).mastery);
    setRevealed(false);
    setAnswers({});
    setFeedback(null);
    setSecondsLeft(timerSeconds);
    setError("");
    setPhase("play");
    cardStartedAt.current = Date.now();
    sessionStartedAt.current = Date.now();
  }

  function renderCardContents() {
    if (!current) return null;
    return (
      <>
        {mode === "flip" ? (
          <>
            <Animated.View style={[s.swipeGrade, s.swipePoor, { pointerEvents: "none", opacity: swipeX.interpolate({ inputRange: [-100, -24, 0], outputRange: [1, 0.2, 0], extrapolate: "clamp" }) }]}>
              <Feather name="arrow-left" size={14} color="#B64036" /><Text style={s.swipePoorText}>Poor</Text>
            </Animated.View>
            <Animated.View style={[s.swipeGrade, s.swipeGood, { pointerEvents: "none", opacity: swipeX.interpolate({ inputRange: [0, 24, 100], outputRange: [0, 0.2, 1], extrapolate: "clamp" }) }]}>
              <Text style={s.swipeGoodText}>Good</Text><Feather name="arrow-right" size={14} color="#23845B" />
            </Animated.View>
          </>
        ) : null}
        <Text style={s.promptLabel}>{current.promptLabel}</Text>
        <Text style={[s.prompt, isMobile && s.promptMobile]}>{current.prompt || "—"}</Text>
        {audio ? <TouchableOpacity style={[s.secondaryButton, { marginTop: 12 }]} onPress={(event) => { event.stopPropagation(); Speech.speak(current.prompt, { rate: 0.85 }); }}><Feather name="volume-2" size={14} color="#526672" /><Text style={s.secondaryButtonText}>Repeat</Text></TouchableOpacity> : null}

        {mode === "flip" ? (
          <>
            {revealed ? <View style={s.revealValues}>{current.targets.map((target) => <View key={target.field} style={s.revealValue}><Text style={s.revealLabel}>{target.label}</Text><Text style={s.revealAnswer}>{target.expected || "Not set"}</Text></View>)}</View> : null}
            <Text style={s.gestureHint}>{revealed ? "Swipe left Poor · Swipe right Good" : "Tap to reveal · Swipe left Poor · Swipe right Good"}</Text>
          </>
        ) : mode === "type" ? (
          <View style={s.answerStack}>
            {current.targets.map((target) => <TextInput key={target.field} style={[s.input, feedback?.[current.targets.indexOf(target)]?.verdict === "wrong" && s.feedbackWrong, feedback?.[current.targets.indexOf(target)]?.verdict && feedback?.[current.targets.indexOf(target)]?.verdict !== "wrong" && s.feedbackCorrect]} value={answers[target.field] ?? ""} onChangeText={(value) => setAnswers((currentAnswers) => ({ ...currentAnswers, [target.field]: value }))} placeholder={target.label} editable={!feedback} onSubmitEditing={() => {}} />)}
            {feedback ? current.targets.map((target, targetIndex) => <Text key={target.field} style={[s.sectionText, { color: feedback[targetIndex]?.verdict === "wrong" ? "#B64036" : "#23845B" }]}>{target.label}: {feedback[targetIndex]?.verdict} · {target.expected}</Text>) : null}
          </View>
        ) : (
          <View style={s.choiceGrid}>{choices.map((choice) => <TouchableOpacity key={choice} disabled={Boolean(feedback)} style={[s.choiceButton, feedback && choice === current.targets.map((target) => target.expected).join(" · ") && s.feedbackCorrect]} onPress={() => { const expected = current.targets.map((target) => target.expected).join(" · "); const result = gradeAnswer(choice, expected); setFeedback(current.targets.map((target) => ({ ...result, expectedDisplay: target.expected }))); }}><Text style={s.choiceText}>{choice}</Text></TouchableOpacity>)}</View>
        )}
      </>
    );
  }

  if (!bundle) {
    return <View style={[s.page, isMobile && s.pageMobile]}><View style={s.emptyCard}>{error ? <Text style={s.errorText}>{error}</Text> : <><ActivityIndicator color={FLASHCARD_ACCENT} /><Text style={[s.emptyText, { marginBottom: 0 }]}>Preparing your drill…</Text></>}</View></View>;
  }

  const missedKeys = Array.from(new Set(outcomes.filter((outcome) => !outcome.correct).map((outcome) => outcome.card.item.key)));
  const correctCards = outcomes.filter((outcome) => outcome.correct).length;
  const accuracy = outcomes.length ? Math.round((correctCards / outcomes.length) * 100) : 0;
  const masteryAfter = calculatePaoStats({ ...bundle, progress: sessionProgress }).mastery;

  return (
    <View style={[s.page, isMobile && s.pageMobile]}>
      <View style={s.toolbar}>
        <TouchableOpacity style={s.secondaryButton} onPress={() => router.replace(`/flashcards/${systemId}` as any)}><Feather name="arrow-left" size={14} color="#526672" /><Text style={s.secondaryButtonText}>{bundle.system.name}</Text></TouchableOpacity>
        <View><Text style={s.panelKicker}>Focused drill</Text><Text style={s.panelTitle}>{phase === "setup" ? "Set up your session" : phase === "play" ? "Recall, then answer" : "Session complete"}</Text></View>
      </View>
      {error ? <View style={s.errorBanner}><Feather name="alert-circle" size={17} color="#B34036" /><Text style={s.errorText}>{error}</Text></View> : null}

      <View style={[s.trainStage, isMobile && s.trainStageMobile]}>
        {phase === "setup" ? (
          <View style={[s.setupPanel, isMobile && s.setupPanelMobile]}>
            <View><Text style={s.panelKicker}>Training settings</Text><Text style={s.sectionTitle}>Choose how you want to recall</Text><Text style={s.sectionText}>Your last-used settings are remembered for this system.</Text></View>
            <View style={s.setupGrid}>
              <Setting label="Mode"><Options values={["flip", "type", "choice"]} value={mode} onChange={(value) => setMode(value as DrillMode)} /></Setting>
              <Setting label="Direction"><Options values={bundle.system.fields.length > 1 ? ["key-fields", "fields-key", "field-field"] : ["key-fields", "fields-key"]} labels={{ "key-fields": "Key → fields", "fields-key": "Fields → key", "field-field": "Person → rest" }} value={directionChoice} onChange={(value) => setDirectionChoice(value as DirectionChoice)} /></Setting>
              <Setting label="Order"><Options values={["smart", "random", "sequential"]} value={order} onChange={(value) => setOrder(value as DrillOrder)} /></Setting>
              <Setting label="Scope"><Options values={["all", "weak", "starred", "range"]} value={scopeChoice} onChange={(value) => setScopeChoice(value as ScopeChoice)} /></Setting>
              <Setting label="Length"><Options values={[10, 25, 50, "all"]} value={length} onChange={(value) => setLength(value as number | "all")} /></Setting>
              <Setting label="Timer"><Options values={[0, 10, 20]} labels={{ "0": "Untimed", "10": "10 sec", "20": "20 sec" }} value={timerSeconds} onChange={(value) => setTimerSeconds(Number(value))} /></Setting>
              <Setting label="Audio prompt"><Options values={["off", "on"]} value={audio ? "on" : "off"} onChange={(value) => setAudio(value === "on")} /></Setting>
              {scopeChoice === "range" ? <Setting label="Key range"><View style={s.optionRow}><TextInput style={[s.input, { width: 85 }]} value={rangeFrom} onChangeText={setRangeFrom} placeholder="00" /><TextInput style={[s.input, { width: 85 }]} value={rangeTo} onChangeText={setRangeTo} placeholder="99" /></View></Setting> : null}
            </View>
            <TouchableOpacity style={s.primaryButton} onPress={() => startSession()}><Feather name="play" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Start {length === "all" ? "full" : length}-card session</Text></TouchableOpacity>
          </View>
        ) : phase === "play" && current ? (
          <View style={[s.setupPanel, isMobile && s.setupPanelMobile]}>
            <View style={s.sessionTop}><Text style={s.sessionCounter}>{index + 1} of {queue.length}</Text>{timerSeconds ? <Text style={s.timerText}>{secondsLeft}s</Text> : null}</View>
            <View style={s.progressTrack}><View style={[s.progressFill, { width: `${((index + 1) / queue.length) * 100}%` }]} /></View>
            <Animated.View
              style={[s.swipeCardWrap, mode === "flip" && { transform: [{ translateX: swipeX }, { rotate: swipeX.interpolate({ inputRange: [-220, 0, 220], outputRange: ["-7deg", "0deg", "7deg"], extrapolate: "clamp" }) }] }]}
              {...(mode === "flip" ? swipeResponder.panHandlers : {})}
            >
              {mode === "flip" ? (
                <TouchableOpacity
                  activeOpacity={0.96}
                  accessibilityRole="button"
                  accessibilityLabel={revealed ? "Answer revealed. Swipe left for poor or right for good." : "Tap to reveal. Swipe left for poor or right for good."}
                  style={[s.flashCard, isMobile && s.flashCardMobile]}
                  onPress={() => { if (!suppressCardTapRef.current) setRevealed(true); }}
                >
                  {renderCardContents()}
                </TouchableOpacity>
              ) : <View style={[s.flashCard, isMobile && s.flashCardMobile]}>{renderCardContents()}</View>}
            </Animated.View>

            <View style={s.actionRow}>
              {mode === "flip" ? (
                !revealed ? (
                  <TouchableOpacity style={s.primaryButton} onPress={() => setRevealed(true)}><Feather name="eye" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Reveal answer</Text></TouchableOpacity>
                ) : (
                  <><TouchableOpacity style={[s.primaryButton, s.missedButton]} onPress={() => recordResult(current.targets.map((target) => ({ verdict: "wrong", expectedDisplay: target.expected })))}><Feather name="x" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Missed it</Text></TouchableOpacity><TouchableOpacity style={[s.primaryButton, s.knewButton]} onPress={() => recordResult(current.targets.map((target) => ({ verdict: "correct", expectedDisplay: target.expected })))}><Feather name="check" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Knew it</Text></TouchableOpacity></>
                )
              ) : mode === "type" ? (
                !feedback ? (
                  <TouchableOpacity style={s.primaryButton} onPress={() => setFeedback(current.targets.map((target) => gradeAnswer(answers[target.field] ?? "", target.expected)))}><Feather name="check" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Check answer</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.primaryButton} onPress={() => recordResult(feedback)}><Feather name="arrow-right" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>{index === queue.length - 1 ? "Finish" : "Next card"}</Text></TouchableOpacity>
                )
              ) : feedback ? <TouchableOpacity style={s.primaryButton} onPress={() => recordResult(feedback)}><Feather name="arrow-right" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>{index === queue.length - 1 ? "Finish" : "Next card"}</Text></TouchableOpacity> : null}
            </View>
          </View>
        ) : (
          <View style={[s.setupPanel, isMobile && s.setupPanelMobile]}>
            <View style={s.resultHero}>{saving ? <ActivityIndicator color={FLASHCARD_ACCENT} /> : <Text style={s.resultScore}>{accuracy}%</Text>}<Text style={s.resultTitle}>{correctCards} of {outcomes.length} cards correct</Text><Text style={s.resultText}>Average {outcomes.length ? Math.round(outcomes.reduce((sum, outcome) => sum + outcome.elapsedMs, 0) / outcomes.length / 100) / 10 : 0}s per card · mastery {sessionMasteryBefore}% → {masteryAfter}%</Text></View>
            {missedKeys.length ? <View><Text style={s.fieldLabel}>Pegs to revisit</Text><View style={s.missedList}>{outcomes.filter((outcome) => !outcome.correct).map((outcome) => <View key={`${outcome.card.id}:${outcome.elapsedMs}`} style={s.missedRow}><Text style={s.missedKey}>{outcome.card.item.displayLabel}</Text><Text style={s.missedText}>{outcome.card.targets.map((target) => target.expected).join(" · ")}</Text></View>)}</View></View> : <View style={s.successBanner}><Feather name="award" size={16} color="#23845B" /><Text style={s.successText}>Perfect session — every peg was recalled.</Text></View>}
            <View style={s.actionRow}>{missedKeys.length ? <TouchableOpacity style={s.primaryButton} onPress={() => startSession(missedKeys)}><Feather name="repeat" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Drill these {missedKeys.length} again</Text></TouchableOpacity> : null}<TouchableOpacity style={s.secondaryButton} onPress={() => setPhase("setup")}><Feather name="sliders" size={14} color="#526672" /><Text style={s.secondaryButtonText}>New session</Text></TouchableOpacity><TouchableOpacity style={s.secondaryButton} onPress={() => router.replace(`/flashcards/${systemId}` as any)}><Text style={s.secondaryButtonText}>Back to system</Text></TouchableOpacity></View>
          </View>
        )}
      </View>
    </View>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={s.setupField}><Text style={s.setupLabel}>{label}</Text>{children}</View>;
}

function Options({ values, value, labels = {}, onChange }: { values: (string | number)[]; value: string | number; labels?: Record<string, string>; onChange: (value: string | number) => void }) {
  return <View style={s.optionRow}>{values.map((option) => <TouchableOpacity key={String(option)} style={[s.optionButton, option === value && s.optionButtonActive]} onPress={() => onChange(option)}><Text style={[s.optionText, option === value && s.optionTextActive]}>{labels[String(option)] ?? String(option)}</Text></TouchableOpacity>)}</View>;
}

function directionLabel(direction: DrillDirection, fieldLabels: string[]) {
  if (direction.to === "key") return `${fieldLabels.join(" / ")} → Key`;
  if (direction.from === "key") return `Key → ${fieldLabels.join(" / ")}`;
  return `${direction.from} → ${(direction.to as string[]).join(" / ")}`;
}
