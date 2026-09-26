import { GraduationCap, ShoppingBag, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import type { GradeDto } from '../../../types';

interface Props {
  gradesLoading: boolean;
  activeGrades: GradeDto[];
  onSelectGrade: (gradeId: string | null) => void;
}

export default function WelcomeScreen({ gradesLoading, activeGrades, onSelectGrade }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-himgiri-primary to-blue-700 text-white rounded-3xl p-8 lg:p-12 shadow-lg shadow-himgiri-primary/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-0 bottom-0 -translate-x-16 translate-y-16 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <GraduationCap className="hidden sm:block absolute -right-6 -bottom-10 h-56 w-56 text-white/[0.07] rotate-[-12deg] pointer-events-none" />
        <div className="relative max-w-2xl space-y-3">
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Academic Session 2026-27
          </span>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-none">
            Official DPS School Kit Distribution
          </h1>
          <p className="text-sm lg:text-base font-semibold text-blue-100 leading-relaxed">
            Welcome to the DPS Hinjawadi Parent Portal. Select your child's grade package below or skip directly to browsing the general items shop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A: Grade Select */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <div className="h-12 w-12 bg-himgiri-primary/10 text-himgiri-primary rounded-2xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Option A: Shop by Grade / Class</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Select your child's grade below to automatically load the mandatory kit bundle and see recommended school items for that class.
            </p>
          </div>

          <div className="space-y-4">
            {gradesLoading ? (
              <div className="flex items-center justify-center py-6 gap-3">
                <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
                <span className="text-xs font-bold text-gray-500">Loading grades...</span>
              </div>
            ) : activeGrades.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold">No active grades found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeGrades.map(grade => (
                  <button
                    key={grade.id}
                    type="button"
                    onClick={() => onSelectGrade(grade.id)}
                    className="p-3 rounded-xl border border-gray-200 text-center hover:border-himgiri-primary hover:bg-himgiri-primary/5 transition-all text-xs font-extrabold text-gray-700 hover:text-himgiri-primary active:scale-95"
                  >
                    {grade.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Option B: General Shop */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Option B: General Items Shop</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Skip grade selection and browse all items directly. Perfect for buying individual textbooks, notebooks, school bags, drawing items, or replacements.
            </p>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onSelectGrade(null)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold active:scale-98 transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
            >
              <span>Browse General Catalog</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
