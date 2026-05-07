import { motion as Motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, color = "blue" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700"
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>

        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </Motion.div>
  );
}