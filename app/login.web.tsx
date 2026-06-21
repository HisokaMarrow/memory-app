import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import FooterSection from "../components/layout/FooterSection";
import NavBar from "../components/layout/NavBar";
import { setActiveResultsUser } from "../components/games/resultsStore";
import { layout } from "../styles/layout";
import { login } from "../styles/screens/login.styles";

export default function LoginPage() {
  const { width } = useWindowDimensions();
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [mode,      setMode]      = useState<"signin" | "signup">("signin");
  const [focused,   setFocused]   = useState<string | null>(null);
  const [error,     setError]     = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const isMobile = width < 640;

  const passwordRef = useRef<TextInput>(null);

  function handleNavClick(id: string) {
    sessionStorage.setItem("scrollTo", id);
    router.push("/");
  }

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (session?.user) {
        setActiveResultsUser(session.user.id);
        router.replace("/dashboard");
      }
      else setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setActiveResultsUser(session.user.id);
        router.replace("/dashboard");
      }
      else setCheckingSession(false);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleAuth() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) { setError("Please fill in all fields."); return; }
    if (!cleanEmail.includes("@")) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (err) setError(err.message);
        else {
          if (data.user) setActiveResultsUser(data.user.id);
          router.replace("/dashboard");
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (err) setError(err.message);
        else if (data.session?.user) {
          setActiveResultsUser(data.session.user.id);
          router.replace("/dashboard");
        }
        else setError("Check your email for a confirmation link.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (err) setError(err.message);
      else setError("Check your email for a password reset link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (err) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isSuccess = error.startsWith("Check");

  if (checkingSession) {
    return (
      <View style={login.root}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={login.root}>
      {/* Background image */}
      <Image
        source={require("../assets/images/login-hero.png")}
        resizeMode="cover"
        style={login.bgImage}
      />
      {/* Dark overlay */}
      <View style={login.overlay} pointerEvents="none" />

      {/* NavBar — already fixed-positioned via header styles */}
      <NavBar scrolled={true} onNavClick={handleNavClick} />

      <ScrollView
        style={layout.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[login.scrollInner, isMobile && login.scrollInnerMobile]}>
        {/* Centred card */}
        <View style={[login.main, isMobile && login.mainMobile]}>
          <View style={[login.card, isMobile && login.cardMobile]}>

            {/* Logo */}
            <View style={login.logoRow}>
              <Image
                source={require("../assets/images/logo.png")}
                resizeMode="cover"
                style={login.logoImg}
              />
              <Text style={login.logoName}>MEMORO</Text>
            </View>

            {/* Heading */}
            <View style={login.headWrap}>
              <Text style={login.h1}>
                {mode === "signin" ? "Welcome back." : "Start your training."}
              </Text>
              <Text style={login.subtitle}>
                {mode === "signin" ? "Sign in to continue your training" : "Create your account to begin"}
              </Text>
            </View>

            {/* Form */}
            <View style={login.form}>
              <TouchableOpacity style={login.googleBtn} onPress={handleGoogleAuth} disabled={loading}>
                <Text style={login.googleIcon}>G</Text>
                <Text style={login.googleText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={login.dividerRow}>
                <View style={login.dividerLine} />
                <Text style={login.dividerText}>or use email</Text>
                <View style={login.dividerLine} />
              </View>

              {/* Email */}
              <View style={login.fieldWrap}>
                <Text style={login.label}>Email</Text>
                <TextInput
                  style={[login.input, isMobile && login.inputMobile, focused === "email" && login.inputFocused]}
                  value={email}
                  onChangeText={(value) => { setEmail(value); if (error && !isSuccess) setError(""); }}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* Password */}
              <View style={login.fieldWrap}>
                <View style={login.passHeader}>
                  <Text style={login.label}>Password</Text>
                  <TouchableOpacity onPress={handlePasswordReset} disabled={loading}>
                    <Text style={login.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={login.passWrap}>
                  <TextInput
                    ref={passwordRef}
                    style={[login.input, isMobile && login.inputMobile, login.inputPass, focused === "password" && login.inputFocused]}
                    value={password}
                    onChangeText={(value) => { setPassword(value); if (error && !isSuccess) setError(""); }}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    onSubmitEditing={handleAuth}
                  />
                  <TouchableOpacity style={login.eyeBtn} onPress={() => setShowPass(!showPass)}>
                    <Text style={login.eyeText}>{showPass ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error / success */}
              {!!error && (
                <View style={[login.msgBox, isSuccess ? login.msgBoxSuccess : login.msgBoxError]}>
                  <Text style={[login.msgText, isSuccess ? login.msgTextSuccess : login.msgTextError]}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[login.submitBtn, loading && login.submitBtnDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={login.submitBtnText}>
                      {mode === "signin" ? "Sign In" : "Create Account"}
                    </Text>
                }
              </TouchableOpacity>
            </View>

            {/* Toggle sign in / sign up */}
            <View style={login.footerRow}>
              <Text style={login.footerText}>
                {mode === "signin" ? "New to MEMORO? " : "Already have an account? "}
                <Text
                  style={login.footerLink}
                  onPress={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </Text>
              </Text>
            </View>

          </View>
        </View>

        {/* Footer */}
        <View style={login.footerWrap}>
          <FooterSection />
        </View>
        </View>
      </ScrollView>
    </View>
  );
}
