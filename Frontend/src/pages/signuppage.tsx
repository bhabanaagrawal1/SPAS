import { SignupForm } from "@/components/signup-form"
import backgroundImage from "@/assets/sky.png"


const signuppage = () => {
  return (
    <div>
      <main
      className="flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <SignupForm className="w-full max-w-275" />
    </main>
    </div>
  )
}

export default signuppage
