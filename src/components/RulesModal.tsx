import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 p-4 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-lg hover:bg-slate-700 transition-all z-40 flex items-center justify-center gap-2 group"
        title="חוקים והדרכה"
      >
        <BookOpen className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">חוקי המשחק והדרכה</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 text-slate-300 pb-8">
              <section className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-blue-400 mb-3">איך לשחק באפליקציה זו?</h3>
                <p className="mb-2">האפליקציה מיועדת להחליף את השימוש בצ'יפים פיזיים כשאתם משחקים משחקי קלפים כמו פוקר או בלאק ג'ק עם חברים בבית. אתם צריכים לארגן חפיסת קלפים פיזית אמיתית.</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li><strong>מנהל (Host):</strong> פותח שולחן מגיש הקלפים בדילר הפיזי, מזרים את השלב, מחלק כסף התחלתי לשחקנים וקובע את תוצאות הסיבוב (את מי שניצח ואת המכפיל).</li>
                  <li><strong>שחקנים:</strong> מצטרפים דרך הטלפון עם קוד או קישור. רואים את היתרה שלהם, ומבצעים פעולות (Call, Raise, Fold) שמשודרות למנהל.</li>
                </ul>
              </section>

              <section className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-emerald-400 mb-3">מושגים: Call, Raise, Fold</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong className="text-white">Call (להשוות):</strong> הימור בסכום הבסיס של התור הנוכחי כדי להישאר במשחק.</li>
                  <li><strong className="text-white">Raise (להעלות):</strong> להגדיל את סכום ההימור. זה יחייב את שאר השחקנים להשוות (לשלם יותר) כדי להישאר בסיבוב. באפליקציה, עליכם להעלות פי 2 מהבסיס לפחות.</li>
                  <li><strong className="text-white">Fold (לפרוש):</strong> לוותר על הקלפים וההימורים שלכם בסיבוב זה. אתם פורשים ולא מחויבים בכסף נוסף.</li>
                </ul>
              </section>

              <section className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-amber-400 mb-3">חוקים בסיסיים: פוקר (טקסס הולדם)</h3>
                <p className="mb-2">טקסס הולדם הוא משחק הפוקר הנפוץ ביותר. המטרה: להרכיב את היד החזקה ביותר של 5 קלפים מתוך 2 קלפי היד שלך ו-5 קלפי קהילה.</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>כל שחקן מקבל שני קלפים אישיים הפוכים.</li>
                  <li>סיבוב הימורים ראשון.</li>
                  <li><strong>הפלופ (Flop):</strong> דילר חושף 3 קלפי קהילה.</li>
                  <li>סיבוב הימורים שני.</li>
                  <li><strong>הטרן (Turn):</strong> דילר חושף קלף קהילה 4.</li>
                  <li>סיבוב הימורים שלישי.</li>
                  <li><strong>הריבר (River):</strong> דילר חושף קלף קהילה אחרון.</li>
                  <li>סיבוב הימורים סופי. מנצח זה שחושף את היד הטובה ביותר, או זה שגרם לכולם לפרוש לפניו.</li>
                </ol>
              </section>

              <section className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-purple-400 mb-3">חוקים בסיסיים: בלאק ג'ק (Blackjack)</h3>
                <p className="mb-2">המטרה בבלאקג'ק היא לנצח את הדילר על ידי השגת סכום קלפים גבוה משלו, שלא עובר 21. כל שחקן משחק נגד הדילר.</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>קלפים ממוספרים: שווים לערכם. נסיך/מלכה/מלך: 10. אס: 1 או 11.</li>
                  <li>שחקנים מהמרים לפני חלוקת הקלפים.</li>
                  <li>כל שחקן מקבל 2 קלפים. הדילר מקבל קלף גלוי וקלף הפוך.</li>
                  <li><strong>Hit (עוד קלף):</strong> קח קלף נוסף. אם תעבור 21 ("נשרפת"), אתה מפסיד את ההימור.</li>
                  <li><strong>Stand (עצור):</strong> עצור כאן ועבור לשחקן הבא.</li>
                  <li>ניצחון רגיל מכפיל הימור. בלאק ג'ק (אס ו-10 מיד) מנצח ביחס גדול יותר (לרוב משלם 1.5 - המנהל יגדיר "מכפיל x2.5" במערכת לאלו ששמו Call רגיל).</li>
                </ol>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
