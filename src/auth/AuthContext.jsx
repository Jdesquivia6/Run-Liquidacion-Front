import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    // Redirigir al Landing
    window.location.href = "/";
  };

  const hasModule = (module) => {
    if (!user) return false;

    if (user.rol === "administrador") {
      return true;
    }

    return user.modulos.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasModule,
        authenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}