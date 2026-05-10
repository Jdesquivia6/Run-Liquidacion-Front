import { motion as Motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, color = "blue" }) {
  const styles = {
    blue: "bg-[#00ABE4]/10 text-[#00ABE4]",
    green: "bg-[#059669]/10 text-[#059669]",
    red: "bg-[#dc2626]/10 text-[#dc2626]",
    amber: "bg-[#d97706]/10 text-[#d97706]",
    slate: "bg-slate-50 text-slate-700"
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-5 transition-transform cursor-default"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748b]">{title}</p>
          <h3 className="text-3xl font-bold text-[#1e293b] mt-2">{value}</h3>
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
