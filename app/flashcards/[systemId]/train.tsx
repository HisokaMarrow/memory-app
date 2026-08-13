import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, PanResponder, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import type { User } from "@supabase/supabase-js";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import { buildChoices, buildQueue, classifySwipe, defaultSessionLength, getBoxCounts, gradeAnswer, nextProgress, type DrillCard, type DrillConfig, type DrillDirection, type DrillMode, type GradeResult } from "../../../components/flashcards/drillEngine";
import { loadDrillPreferences, saveDrillPreferences } from "../../../components/flashcards/paoPreferences";
import { calculatePaoStats, loadPaoSystem, savePaoProgress } from "../../../components/flashcards/paoStore";
import type { FieldId, PaoSystemBundle, PegProgress } from "../../../components/flashcards/paoTypes";
import { saveGameResult } from "../../../components/games/resultsStore";
import { FLASHCARD_ACCENT, flashcards as s } from "../../../styles/screens/flashcards.styles";

type Phase = "setup" | "play" | "results";
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
  const [practiceField, setPracticeField] = useState<"all" | FieldId>("all");
  const [lengthInput, setLengthInput] = useState(itemKey ? "1" : "");
  const [audio, setAudio] = useState(false);
  const [queue, setQueue] = useState<DrillCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<GradeResult[] | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [sessionProgress, setSessionProgress] = useState<PegProgress[]>([]);
  const [sessionMasteryBefore, setSessionMasteryBefore] = useState(0);
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
        const available = itemKey ? next.items.filter((item) => item.key === itemKey).length : next.items.length;
        const savedLength = typeof saved?.length === "number" && Number.isFinite(saved.length) && saved.length > 0 ? saved.length : null;
        setLengthInput(String(itemKey ? 1 : Math.min(available, savedLength ?? defaultSessionLength(available))));
        const savedDirection = saved?.direction;
        if (savedDirection?.from === "key" && Array.isArray(savedDirection.to) && savedDirection.to.length === 1 && next.system.fields.some((field) => field.id === savedDirection.to[0])) {
          setPracticeField(savedDirection.to[0]);
        }
      })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Training could not be opened."));
  }, [itemKey, systemId, user]);

  const direction = useMemo<DrillDirection>(() => {
    const fields = bundle?.system.fields ?? [];
    const selected = fields.find((field) => field.id === practiceField);
    return { from: "key", to: selected ? [selected.id] : fields.map((field) => field.id) };
  }, [bundle, practiceField]);

  const availableItems = useMemo(() => {
    if (!bundle) return [];
    return itemKey ? bundle.items.filter((item) => item.key === itemKey) : bundle.items;
  }, [bundle, itemKey]);
  const recommendedLength = defaultSessionLength(availableItems.length);
  const sessionLength = useMemo(() => {
    const parsed = Number.parseInt(lengthInput, 10);
    const requested = Number.isFinite(parsed) && parsed > 0 ? parsed : recommendedLength;
    return Math.max(1, Math.min(availableItems.length || 1, requested));
  }, [availableItems.length, lengthInput, recommendedLength]);

  const config = useMemo<DrillConfig>(() => ({
    systemId,
    direction,
    mode,
    length: sessionLength,
  }), [direction, mode, sessionLength, systemId]);

  const boxCounts = useMemo(() => bundle
    ? getBoxCounts(availableItems, bundle.progress, direction.to === "key" ? ["key"] : direction.to)
    : { unseen: 0, box0: 0, box1: 0, box2: 0, box3: 0 }, [availableItems, bundle, direction]);

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
        gameTitle: `${bundle.system.name} — ${directionLabel(direction, bundle.system.fields)}`,
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
          boxSystem: "leitner-4",
          practice: practiceField,
          targets: directionLabel(direction, bundle.system.fields),
          sessionLength: nextOutcomes.length,
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The session could not be saved.");
    } finally {
      finishingRef.current = false;
      setSaving(false);
    }
  }, [bundle, direction, mode, practiceField, systemId]);

  const recordResult = useCallback((results: GradeResult[]) => {
    if (!current || finishingRef.current) return;
    const elapsedMs = Math.max(1, Date.now() - cardStartedAt.current);
    const correct = results.every((result) => result.verdict !== "wrong");
    const progressMap = new Map(sessionProgress.map((entry) => [`${entry.itemId}:${entry.field}`, entry]));
    current.targets.forEach((target, targetIndex) => {
      const key = `${current.item.id}:${target.field}`;
      const fieldResult = correct
        ? results[targetIndex] ?? { verdict: "correct", expectedDisplay: target.expected }
        : { verdict: "wrong" as const, expectedDisplay: target.expected };
      progressMap.set(key, nextProgress(progressMap.get(key), fieldResult, elapsedMs, current.item.id, target.field));
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
    cardStartedAt.current = Date.now();
  }, [current, finishSession, index, outcomes, queue.length, sessionProgress]);

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

  function startSession(onlyKeys?: string[]) {
    if (!bundle) return;
    let sourceItems = bundle.items;
    if (itemKey) sourceItems = sourceItems.filter((item) => item.key === itemKey);
    if (onlyKeys?.length) sourceItems = sourceItems.filter((item) => onlyKeys.includes(item.key));
    const nextQueue = buildQueue(sourceItems, bundle.progress, { ...config, length: onlyKeys?.length ?? config.length }, bundle.system.fields);
    if (!nextQueue.length) {
      setError("There are no cards available for this session.");
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
            <View><Text style={s.panelKicker}>Training settings</Text><Text style={s.sectionTitle}>A simple four-box session</Text><Text style={s.sectionText}>Unsorted cards appear first. Correct answers move up a box; missed cards return to Box 0.</Text></View>
            <View style={s.boxSummary}>
              <BoxCount label="Unsorted" value={boxCounts.unseen} tone="unseen" />
              <BoxCount label="Box 0" value={boxCounts.box0} tone="box0" />
              <BoxCount label="Box 1" value={boxCounts.box1} tone="box1" />
              <BoxCount label="Box 2" value={boxCounts.box2} tone="box2" />
              <BoxCount label="Box 3" value={boxCounts.box3} tone="box3" />
            </View>
            <View style={s.setupGrid}>
              <Setting label="Mode"><Options values={["flip", "type", "choice"]} labels={{ flip: "Flip", type: "Type", choice: "Multiple choice" }} value={mode} onChange={(value) => setMode(value as DrillMode)} /></Setting>
              <Setting label="Practice"><Options values={["all", ...bundle.system.fields.map((field) => field.id)]} labels={{ all: bundle.system.fields.length === 3 ? "All three" : "All fields", ...Object.fromEntries(bundle.system.fields.map((field) => [field.id, field.label])) }} value={practiceField} onChange={(value) => setPracticeField(String(value))} /></Setting>
              <Setting label="Cards this session">
                <TextInput
                  style={s.input}
                  value={lengthInput}
                  onChangeText={(value) => setLengthInput(value.replace(/[^0-9]/g, ""))}
                  onBlur={() => setLengthInput(String(sessionLength))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  selectTextOnFocus
                  maxLength={5}
                  accessibilityLabel="Number of cards in this session"
                />
                <Text style={s.settingHint}>Suggested: {recommendedLength} cards (25% of this system). Maximum {availableItems.length}.</Text>
              </Setting>
              <Setting label="Audio prompt"><Options values={["off", "on"]} value={audio ? "on" : "off"} onChange={(value) => setAudio(value === "on")} /></Setting>
            </View>
            <TouchableOpacity style={s.primaryButton} onPress={() => startSession()}><Feather name="play" size={15} color="#FFFFFF" /><Text style={s.primaryButtonText}>Start {sessionLength}-card session</Text></TouchableOpacity>
          </View>
        ) : phase === "play" && current ? (
          <View style={[s.setupPanel, isMobile && s.setupPanelMobile]}>
            <View style={s.sessionTop}><Text style={s.sessionCounter}>{index + 1} of {queue.length}</Text><Text style={s.sessionBoxText}>Unsorted first · Box 0 most often</Text></View>
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

function BoxCount({ label, value, tone }: { label: string; value: number; tone: "unseen" | "box0" | "box1" | "box2" | "box3" }) {
  return <View style={[s.boxCount, s[`boxCount_${tone}`]]}><Text style={s.boxCountValue}>{value}</Text><Text style={s.boxCountLabel}>{label}</Text></View>;
}

function Options({ values, value, labels = {}, onChange }: { values: (string | number)[]; value: string | number; labels?: Record<string, string>; onChange: (value: string | number) => void }) {
  return <View style={s.optionRow}>{values.map((option) => <TouchableOpacity key={String(option)} style={[s.optionButton, option === value && s.optionButtonActive]} onPress={() => onChange(option)}><Text style={[s.optionText, option === value && s.optionTextActive]}>{labels[String(option)] ?? String(option)}</Text></TouchableOpacity>)}</View>;
}

function directionLabel(direction: DrillDirection, fields: { id: FieldId; label: string }[]) {
  if (direction.to === "key") return `${fields.map((field) => field.label).join(" / ")} → Key`;
  if (direction.from === "key") return `Key → ${(direction.to as FieldId[]).map((fieldId) => fields.find((field) => field.id === fieldId)?.label ?? fieldId).join(" / ")}`;
  return `${direction.from} → ${(direction.to as string[]).join(" / ")}`;
}
