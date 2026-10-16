import { NextRequest } from "next/server";
import * as jose from "jose";
import { RequestUser } from "@/types/requestUser";
import { promises } from "dns";

export async function getUser(request: NextRequest):Promise<RequestUser| null> {
    const loginToken = request.cookies.get("login-token")?.value;
        const secretText = process.env.JOSE_SECRET;
        const secret = new TextEncoder().encode(secretText);
        try{
            const  tokenData=await jose.jwtVerify(
                loginToken||"", secret
            )
            const user = tokenData.payload as unknown as RequestUser
            return user
        }catch{
            return null
        }
    
}
export async function isPrivileged(request:NextRequest, privilege:string): Promise<boolean>{
    const user:RequestUser| null=await getUser(request)
    if(user==null){
        return false
    }
    if(user.privileges.includes(privilege)){
        return true
    }
    return false


}