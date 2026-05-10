import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Car,
  Search,
  FileText,
  History,
  Users,
  BarChart3,
  Shield,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ChevronUp,
  Bot
} from "lucide-react";

// ============================================
// Componentes SVG Personalizados
// ============================================

// Componente de candado (reemplazo de lucide)
const Lock = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ============================================
// Componentes de Animación
// ============================================

function FadeIn({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Número animado para estadísticas
function AnimatedNumber({ end, suffix = "", duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentCount = Math.floor(eased * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ============================================
//Tarjeta de Servicio
// ============================================

function ServiceCard({ icon: Icon, title, description, delay }) {
  return (
    <FadeIn delay={delay} direction="up">
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 group"
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00ABE4]/10 to-[#00ABE4]/5 flex items-center justify-center mb-4 group-hover:from-[#00ABE4]/20 group-hover:to-[#00ABE4]/10 transition-all duration-300">
          <Icon className="w-7 h-7 text-[#00ABE4]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </motion.div>
    </FadeIn>
  );
}

// Tarjeta de Badge/Certificación
function BadgeCard({ icon: Icon, title, description, delay }) {
  return (
    <FadeIn delay={delay} direction="up">
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center border border-white/20"
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center mb-4 shadow-md">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h4 className="text-[#1e293b] font-bold text-base mb-2">{title}</h4>
        <p className="text-[#64748b] text-sm leading-relaxed">{description}</p>
      </motion.div>
    </FadeIn>
  );
}

// ============================================
// HEADER / NAVBAR
// ============================================

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">
              Auto<span className="text-[#00ABE4]">Core</span>
            </span>
          </motion.div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("inicio")}
              className="text-gray-600 hover:text-[#00ABE4] font-medium transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => scrollToSection("servicios")}
              className="text-gray-600 hover:text-[#00ABE4] font-medium transition-colors"
            >
              Servicios
            </button>
            <button
              onClick={() => scrollToSection("acerca")}
              className="text-gray-600 hover:text-[#00ABE4] font-medium transition-colors"
            >
              Acerca de
            </button>
            <button
              onClick={() => scrollToSection("contacto")}
              className="text-gray-600 hover:text-[#00ABE4] font-medium transition-colors"
            >
              Contacto
            </button>
          </nav>

          {/* Botón Ingresar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="bg-[#00ABE4] hover:bg-[#0095C5] text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-btn"
          >
            <span className="hidden sm:inline">Ingresar</span>
            <span className="sm:hidden">Ingresar</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

// ============================================
// HERO SECTION
// ============================================

function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-[#E9F1FA] via-blue-50 to-white"
    >
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-[#00ABE4]/5"
          style={{ top: "10%", left: "5%" }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full bg-[#00ABE4]/8"
          style={{ top: "60%", right: "10%" }}
          animate={{ y: [0, 15, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-[#00ABE4]/6"
          style={{ bottom: "20%", left: "15%" }}
          animate={{ y: [0, -10, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido de texto */}
          <FadeIn direction="left">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-[#00ABE4]/20"
              >
                <Shield className="w-4 h-4 text-[#00ABE4]" />
                <span className="text-[#00ABE4] text-sm font-medium">
                  Plataforma Oficial
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
                Auto<span className="text-[#00ABE4]">Core</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-4">
                Centro inteligente de operaciones vehiculares
              </p>

              <p className="text-gray-500 mb-8">
                Plataforma de inteligencia vehicular diseñada para centralizar consultas,
                automatizar procesos y optimizar operaciones mediante tecnología avanzada.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-2 bg-[#00ABE4] hover:bg-[#0095C5] text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-btn"
                >
                  <span>Acceder al Sistema</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-[#00ABE4]"
                >
                  <span>Ver Servicios</span>
                </motion.button>
              </div>
            </div>
          </FadeIn>

          {/* Imagen/ilustración decorativa */}
          <FadeIn delay={0.3} direction="right">
            <div className="relative flex justify-center lg:justify-end">
              {/* Tarjeta flotante decorativa */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-md"
              >
                {/* Círculo decorativo grande */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ABE4]/20 to-[#0095C5]/10 rounded-full blur-3xl" />

                {/* Ilustración principal */}
                <div className="relative bg-white rounded-3xl shadow-card-hover p-8 sm:p-10 border border-gray-100">
                  {/* Icono del vehículo */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center"
                    >
                      <Car className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                    </motion.div>
                  </div>

                  {/* Información de ejemplo */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-[#00ABE4]" />
                        <span className="text-gray-600 font-medium">Placa</span>
                      </div>
                      <span className="text-gray-800 font-semibold">ABC-123</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#00ABE4]" />
                        <span className="text-gray-600 font-medium">Estado</span>
                      </div>
                      <span className="text-green-600 font-semibold">Activo</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-[#00ABE4]" />
                        <span className="text-gray-600 font-medium">Trámite</span>
                      </div>
                      <span className="text-gray-800 font-semibold">Pendiente</span>
                    </div>
                  </div>
                </div>

                {/* Badge flotante 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Datos Verificados</span>
                  </div>
                </motion.div>

                {/* Badge flotante 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#00ABE4]" />
                    <span className="text-sm font-medium text-gray-700">Tiempo Real</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Wave decorativo inferior */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

// ============================================
// SECCIÓN DE SERVICIOS
// ============================================

function Services() {
  const services = [
    {
      icon: Search,
      title: "Consulta de Placas",
      description:
        "Búsqueda rápida y precisa de vehículos por número de placa con información actualizada del RUNT."
    },
    {
      icon: Car,
      title: "Datos del Vehículo",
      description:
        "Consulta completa de características, especificaciones técnicas e historial del vehículo registrado."
    },
    {
      icon: FileText,
      title: "Liquidaciones RUNT",
      description:
        "Genera y gestiona liquidaciones oficiales de trámites vehiculares de forma ágil y sin errores."
    },
    {
      icon: Bot,
      title: "IA Operativa",
      description:
        "Agente de inteligencia artificial para asistencia institucional que optimiza tiempos de respuesta y reduce errores humanos en procesos de consulta, validación y análisis documental."
    },
    {
      icon: History,
      title: "Historial de Consultas",
      description:
        "Accede al histórico completo de todas tus consultas y operaciones realizadas en la plataforma."
    },
    {
      icon: Users,
      title: "Gestión de Usuarios",
      description:
        "Administra múltiples usuarios con roles y permisos diferenciados para tu organización."
    },
    {
      icon: BarChart3,
      title: "Reportes y Estadísticas",
      description:
        "Genera informes detallados y métricas clave para la toma de decisiones informadas."
    }
  ];

  return (
    <section id="servicios" className="py-20 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#00ABE4]/10 text-[#00ABE4] text-sm font-semibold rounded-full mb-4">
              NUESTROS SERVICIOS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Soluciones Completas para Gestión Vehicular
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Ofrecemos un conjunto integral de herramientas para optimizar tus procesos
              de liquidación y consulta vehicular.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECCIÓN ESTADÍSTICAS
// ============================================

function Stats() {
  const stats = [
    { end: 125000, suffix: "+", label: "Placas Consultadas" },
    { end: 45000, suffix: "+", label: "Liquidaciones" },
    { end: 2800, suffix: "+", label: "Usuarios Activos" },
    { end: 98, suffix: "%", label: "Consultas Exitosas" }
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-r from-[#00ABE4] to-[#0095C5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Números que Hablan
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Compromiso y resultados demostrados en cada operación realizada.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.15}>
              <div className="text-center">
                <AnimatedNumber end={stat.end} suffix={stat.suffix} />
                <p className="text-white/90 text-sm sm:text-base font-medium mt-2">
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECCIÓN ACERCA DE
// ============================================

function About() {
  return (
    <section
      id="acerca"
      className="py-20 sm:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <div>
              <span className="inline-block px-4 py-1.5 bg-[#00ABE4]/10 text-[#00ABE4] text-sm font-semibold rounded-full mb-4">
                ACERCA DE NOSOTROS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                Facilitando la Gestión Vehicular en Colombia
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                  Brindar soluciones tecnológicas confiables para la gestión vehicular,
                  garantizando transparencia, eficiencia y seguridad en cada transacción.
                  Proporcionamos información precisa y actualizada.
              </p>

              {/* Misión */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ABE4]" />
                  Misión
                </h3>
                <p className="text-gray-500 ml-4">
                  Brindar soluciones tecnológicas confiables para la gestión vehicular,
                  garantizando transparencia, eficiencia y seguridad en cada transacción.
                </p>
              </div>

              {/* Visión */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ABE4]" />
                  Visión
                </h3>
                <p className="text-gray-500 ml-4">
                  Ser la plataforma líder en gestión vehicular en Colombia,
                  innovando constantemente para superar las expectativas de nuestros usuarios.
                </p>
              </div>

              {/* Valores */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ABE4]" />
                  Valores
                </h3>
                <div className="flex flex-wrap gap-2 ml-4">
                  {["Transparencia", "Eficiencia", "Seguridad", "Innovación"].map(
                    (valor) => (
                      <span
                        key={valor}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {valor}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="right">
            <div className="relative">
              {/* Card decorativo grande */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ABE4]/10 to-[#0095C5]/5 rounded-3xl blur-2xl" />

              <div className="relative bg-white rounded-2xl shadow-card-hover p-8 border border-gray-100">
                {/* Logo grande */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center">
                    <Car className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Auto<span className="text-[#00ABE4]">Core</span>
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Plataforma Oficial de Gestión Vehicular
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Versión</span>
                      <span className="text-[#00ABE4] font-semibold">2.0.0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Estado</span>
                      <span className="text-green-600 font-semibold">Operativo</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Última actualización</span>
                      <span className="text-gray-800 font-semibold">Mayo 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECCIÓN EVIDENCIAS / BADGES
// ============================================

function Badges() {
  const badges = [
    {
      icon: Shield,
      title: "Sistema Oficial RUNT",
      description: "Datos verificados directamente del registro"
    },
    {
      icon: CheckCircle,
      title: "Datos Verificados",
      description: "Información actualizada en tiempo real"
    },
    {
      icon: Lock,
      title: "Plataforma Segura",
      description: "Cifrado y protección de datos"
    },
    {
      icon: Clock,
      title: "Actualización en Tiempo Real",
      description: "Sincronización instantánea con RUNT"
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-[#0095C5] to-[#00ABE4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full mb-4">
              CERTIFICACIONES Y GARANTÍAS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Confianza y Validación
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Garantizamos la calidad y seguridad de cada operación realizada en
              nuestra plataforma.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <BadgeCard
              key={badge.title}
              icon={badge.icon}
              title={badge.title}
              description={badge.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="contacto" className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                Auto<span className="text-[#00ABE4]">Core</span>
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              AutoCore centraliza consultas vehiculares, trazabilidad, análisis
              operativo y automatización en una plataforma moderna, segura y escalable.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-[#00ABE4]" />
                <span>Barranquilla ATL, Colombia</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-[#00ABE4]" />
                <span className="text-gray-400">jsef1023@autocore.gov.co</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-[#00ABE4]" />
                <span>+57 (300) 115-4042</span>
              </div>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {[
                { label: "Inicio", id: "inicio" },
                { label: "Servicios", id: "servicios" },
                { label: "Acerca de", id: "acerca" },
                { label: "Contacto", id: "contacto" }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => {
                      const element = document.getElementById(link.id);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-gray-400 hover:text-[#00ABE4] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceso */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Acceso</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-400 hover:text-[#00ABE4] transition-colors"
                >
                  Iniciar Sesión
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/recuperar-password")}
                  className="text-gray-400 hover:text-[#00ABE4] transition-colors"
                >
                  Recuperar Contraseña
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright y botón volver arriba */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 AutoCore. Todos los derechos reservados.
          </p>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[#00ABE4] flex items-center justify-center"
          >
            <ChevronUp className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />
      <Hero />
      <Services />
      <Stats />
      <About />
      <Badges />
      <Footer />
    </div>
  );
}