
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/app/language-selector";
import { useTranslation } from "@/context/language-context";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col flex-1 items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="animate-gradient-shift bg-[length:200%_auto] text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                {t('settings.title')}
            </h1>
            <p className="text-muted-foreground mt-2">{t('settings.description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.language.title')}</CardTitle>
            <CardDescription>
              {t('settings.language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <LanguageSelector />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
