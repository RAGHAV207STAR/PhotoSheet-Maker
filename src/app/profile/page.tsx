
"use client";

import { useState, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Edit, LogOut, User as UserIcon, LogIn, Loader2, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSpinner } from "@/components/ui/google-spinner";
import dynamic from "next/dynamic";

const ProfilePageContent = () => {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
  
    const handleLogout = async () => {
      if (!auth) return;
      try {
        await signOut(auth);
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        router.push('/login');
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: "An error occurred during logout.",
        });
      }
    };
  
    const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
  
      setIsUpdating(true);
      try {
        await updateProfile(user, { displayName });
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        setIsEditModalOpen(false);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message,
        });
      } finally {
        setIsUpdating(false);
      }
    };
  
    if (isUserLoading) {
      return (
        <div className="flex flex-col flex-1 bg-background items-center justify-center">
          <GoogleSpinner />
        </div>
      );
    }
  
    if (!user) {
      return (
         <div className="flex flex-col flex-1 items-center justify-center p-4 animate-gradient-shift bg-[length:200%_auto] bg-gradient-to-br from-cyan-100 via-blue-200 to-purple-200">
           <Card className="w-full max-w-md text-center bg-white/30 backdrop-blur-lg border border-white/20 shadow-lg">
              <CardHeader className="items-center p-6 sm:p-8">
                  <div className="p-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_4px_20px_rgba(3,105,161,0.3)] mb-4">
                      <UserIcon className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-extrabold tracking-tight">Manage Your Profile</CardTitle>
                  <CardDescription className="text-foreground/80 text-base mt-2">Log in to view your details and manage your account settings.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                  <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all" size="lg">
                      <Link href="/login">
                          Go to Login
                      </Link>
                  </Button>
              </CardContent>
           </Card>
         </div>
      )
    }
  
    return (
      <div className="flex flex-col flex-1 bg-background p-4 sm:p-6 md:p-8 justify-center items-center">
          <div className="w-full max-w-lg">
              <h1 className="animate-gradient-shift bg-[length:200%_auto] text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-8 text-center">Your Profile</h1>
              <Card>
                  <CardHeader className="items-center text-center">
                      <Avatar className="w-24 h-24 mb-2 border-4 border-primary/20">
                          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                          <AvatarFallback>
                              <UserIcon className="h-10 w-10"/>
                          </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-2xl">{user.displayName || 'User'}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Separator />
                      <div className="py-4 space-y-2">
                          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                          <DialogTrigger asChild>
                              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => { setDisplayName(user.displayName || ''); }}>
                                  <span className="flex items-center gap-4">
                                      <Edit className="w-5 h-5 text-muted-foreground" />
                                      <span>Edit Profile</span>
                                  </span>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              </button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                              <DialogTitle>Edit Profile</DialogTitle>
                              <DialogDescription>
                                  Make changes to your profile here. Click save when you're done.
                              </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUpdateProfile}>
                              <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="displayName" className="text-right">
                                      Name
                                  </Label>
                                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="col-span-3" />
                                  </div>
                              </div>
                              <DialogFooter>
                                  <DialogClose asChild>
                                  <Button type="button" variant="secondary">
                                      Cancel
                                  </Button>
                                  </DialogClose>
                                  <Button type="submit" disabled={isUpdating}>
                                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save changes
                                  </Button>
                              </DialogFooter>
                              </form>
                          </DialogContent>
                          </Dialog>
                          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => router.push('/history')}>
                              <span className="flex items-center gap-4">
                                  <History className="w-5 h-5 text-muted-foreground" />
                                  <span>View History</span>
                              </span>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </button>
                      </div>
                      <Separator />
                      <div className="pt-4">
                          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                              <LogOut className="mr-4"/>
                              Logout
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    );
};

const ProfilePage = dynamic(() => Promise.resolve(ProfilePageContent), {
    loading: () => <div className="flex flex-col flex-1 bg-background items-center justify-center">
        <GoogleSpinner />
    </div>,
    ssr: false,
});

export default ProfilePage;
