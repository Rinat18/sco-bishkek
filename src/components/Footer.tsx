"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">ШКУ</span>
          </div>
          <span className="text-white font-semibold">SCO Bishkek 2026</span>
        </div>
        <p className="text-sm">{t("official")}</p>
        <p className="text-xs mt-2">© 2026 {t("rights")}</p>
      </div>
    </footer>
  );
}
