
import senacfoto from "@/app/assets/senacfoto.png"
import senaclogo from "@/app/assets/senaclogo.svg"
import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            
            <Image
              src={senaclogo}
              alt="Senac Minas Logo"
              width={100}
              height={100}
            >
            </Image>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
            src={senacfoto}
            alt="Login Image"
            fill
            className="object-cover object-[10%_center]" 
          />
      </div>
    </div>
  )
}
