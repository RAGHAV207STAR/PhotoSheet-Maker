
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { GoogleSpinner } from '@/components/ui/google-spinner';
import dynamic from 'next/dynamic';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

const LoginPageContent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authActionLoading, setAuthActionLoading] = useState<null | 'login' | 'signup' | 'google'>(null);
    
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleAuthAction = async (action: 'login' | 'signup') => {
        if (!auth) return;
        setAuthActionLoading(action);
        
        const authPromise = action === 'login'
            ? signInWithEmailAndPassword(auth, email, password)
            : createUserWithEmailAndPassword(auth, email, password);

        try {
            await authPromise;
            // The useEffect hook will handle the redirect on successful login
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Authentication Failed',
                description: error.message,
            });
        } finally {
            setAuthActionLoading(null);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setAuthActionLoading('google');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          'login_hint': 'user@example.com',
          'brand': 'SiRa Editor'
        });
        
        try {
            await signInWithPopup(auth, provider);
             // The useEffect hook will handle the redirect on successful login
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({
                  variant: 'destructive',
                  title: 'Google Sign-In Failed',
                  description: error.message,
                });
            }
        } finally {
            setAuthActionLoading(null);
        }
    };

    if (isUserLoading || (!isUserLoading && user)) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-blue-100">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <GoogleSpinner />
                <span className="font-semibold text-lg">{user ? 'Redirecting...' : 'Loading...'}</span>
            </div>
          </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-100 via-sky-100 to-blue-200 animate-gradient-shift bg-[length:200%_auto]">
        <Card className="w-full max-w-sm border-0 bg-white/50 backdrop-blur-lg shadow-2xl rounded-2xl">
            <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight animate-gradient-shift bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-blue-600">
                Welcome Back
            </CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('login'); }}>
                    <div className="py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email-login">Email</Label>
                                <Input id="email-login" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!authActionLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password-login">Password</Label>
                                <Input id="password-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!!authActionLoading} />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={!!authActionLoading}>
                        {authActionLoading === 'login' ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                </TabsContent>
                <TabsContent value="signup">
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signup'); }}>
                    <div className="py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email-signup">Email</Label>
                                <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!authActionLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!!authActionLoading} />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!!authActionLoading}>
                        {authActionLoading === 'signup' ? 'Signing up...' : 'Sign Up'}
                    </Button>
                </form>
                </TabsContent>
            </Tabs>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!!authActionLoading}>
                {authActionLoading === 'google' ? <GoogleSpinner className='mr-2 h-5 w-5' /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                Google
            </Button>
            </CardContent>
        </Card>
        </div>
    );
}

const LoginPage = dynamic(() => Promise.resolve(LoginPageContent), {
    loading: () => <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-blue-100">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <GoogleSpinner />
            <span className="font-semibold text-lg">Loading...</span>
        </div>
      </div>,
    ssr: false
});

export default LoginPage;
