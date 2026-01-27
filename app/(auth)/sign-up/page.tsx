import AuthForm from "../../../components/AuthForm";

export default function SignUpPage() {
  return (
    <div className="stack" style={{ gap: 24, paddingTop: 64 }}>
      <AuthForm mode="sign-up" />
      <p className="muted" style={{ textAlign: "center" }}>
        Already have an account? <a className="link" href="/sign-in">Sign in</a>
      </p>
    </div>
  );
}