import AuthForm from "../../../components/AuthForm";

export default function SignInPage() {
  return (
    <div className="stack" style={{ gap: 24, paddingTop: 64 }}>
      <AuthForm mode="sign-in" />
      <p className="muted" style={{ textAlign: "center" }}>
        New here? <a className="link" href="/sign-up">Create an account</a>
      </p>
    </div>
  );
}