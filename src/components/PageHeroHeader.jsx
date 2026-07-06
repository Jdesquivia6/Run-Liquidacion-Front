import { FileText } from "lucide-react";

export default function PageHeroHeader({
  label,
  labelIcon: LabelIcon = FileText,
  title,
  description,
  badgeCount,
  badgeLabel,
  actionButton,
  icon: HeroIcon = FileText,
  iconPosition = "right"
}) {
  return (
    <div className="bg-gradient-to-br from-[#00ABE4] to-[#0095C5] rounded-[28px] shadow-lg shadow-[#00ABE4]/20 p-6 md:p-8 relative overflow-hidden">
      {/* Ícono decorativo */}
      <div
        className={`absolute select-none pointer-events-none opacity-10 ${
          iconPosition === "right" ? "right-4 md:right-8" : "left-4 md:left-8"
        } bottom-3 hidden md:block`}
      >
        <HeroIcon className="w-44 h-44" />
      </div>
      <div
        className={`absolute select-none pointer-events-none opacity-10 ${
          iconPosition === "right" ? "right-4 top-4" : "left-4 top-4"
        } md:hidden`}
      >
        <HeroIcon className="w-24 h-24" />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label superior */}
          <div className="flex items-center gap-1.5 mb-3">
            <LabelIcon className="w-3.5 h-3.5 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
              {label}
            </span>
          </div>

          {/* Título */}
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {title}
          </h2>

          {/* Descripción */}
          {description && (
            <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl leading-relaxed">
              {description}
            </p>
          )}

          {/* Badges de resumen */}
          {badgeCount !== undefined && badgeCount > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <FileText size={12} />
                {badgeCount} {badgeLabel || "item"}
                {badgeCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Botón de acción */}
        {actionButton && (
          <div className="shrink-0 flex items-start">{actionButton}</div>
        )}
      </div>
    </div>
  );
}
