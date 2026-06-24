"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const locales = [
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
    { code: "ky", label: "Кыргызча" },
    { code: "zh", label: "中文" },
  ];

  function switchLocale(newLocale: string) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setLangOpen(false);
  }

  function localePath(path: string) {
    return `/${locale}${path}`;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={localePath("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">ШКУ</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">SCO Bishkek 2026</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href={localePath("/")} className="text-gray-600 hover:text-blue-700 text-sm font-medium">
              {t("home")}
            </Link>
            <Link href={localePath("/hotels")} className="text-gray-600 hover:text-blue-700 text-sm font-medium">
              {t("hotels")}
            </Link>

            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-700 text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                {locale.toUpperCase()}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        locale === l.code ? "text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
            <Link href={localePath("/")} className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>
              {t("home")}
            </Link>
            <Link href={localePath("/hotels")} className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>
              {t("hotels")}
            </Link>
            <div className="border-t border-gray-100 pt-2">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { switchLocale(l.code); setMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded ${
                    locale === l.code ? "text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
