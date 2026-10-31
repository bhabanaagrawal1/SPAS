import { LoginForm } from "@/components/login-form";
import backgroundImage from "@/assets/sky.png";

const loginpage = () => {
  return (
    <div>
      <main
      className="flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <LoginForm className="w-full max-w-5xl" />
    </main>
    </div>
  )
}

export default loginpage
