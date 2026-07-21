import React, { useState, useEffect } from "react";
import {
  UserProfile,
  ActivityLog,
  AdminTab,
  UserTab,
  LoginFormState,
  NewUserFormState,
  EditUserFormState,
} from "./types";
import { authApi, adminApi } from "./services/api";

import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { NotificationBanner } from "./components/common/NotificationBanner";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { PermissionsMatrix } from "./components/common/PermissionsMatrix";

import { LoginForm } from "./components/auth/LoginForm";
import { Sidebar } from "./components/layout/Sidebar";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminLogs } from "./components/admin/AdminLogs";
import { UserWorkspace } from "./components/user/UserWorkspace";

export default function App() {
  // Session State
  const [token, setToken] = useState<string | null>(localStorage.getItem("jwt_token"));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Form State
  const [loginForm, setLoginForm] = useState<LoginFormState>({ username: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // System Banners State
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Dashboard Navigation State
  const [adminTab, setAdminTab] = useState<AdminTab>("users");
  const [userTab, setUserTab] = useState<UserTab>("host");

  // Admin Workspace State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("");

  // Admin Action Form State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserFormState>({
    username: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  });
  const [newUserErrors, setNewUserErrors] = useState<Record<string, string>>({});

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState<EditUserFormState>({
    username: "",
    email: "",
    role: "user",
    status: "active",
  });
  const [editUserErrors, setEditUserErrors] = useState<Record<string, string>>({});

  // Check Current Session on Mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setIsAuthenticating(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const user = await authApi.me(token);
      setCurrentUser(user);
    } catch (err) {
      handleLogout();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await authApi.logout(token);
    }
    localStorage.removeItem("jwt_token");
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setLogs([]);
    setApiSuccess(null);
    setApiError(null);
  };

  // Auth Action Handlers
  const validateLoginForm = () => {
    const errors: Record<string, string> = {};
    if (!loginForm.username.trim()) {
      errors.username = "Le nom d'utilisateur ou l'e-mail est requis";
    }
    if (!loginForm.password) {
      errors.password = "Le mot de passe est requis";
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setApiError(null);
    setApiSuccess(null);
    try {
      const data = await authApi.login(loginForm);
      localStorage.setItem("jwt_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setLoginForm({ username: "", password: "" });
    } catch (err: any) {
      setApiError(err.message || "Impossible de se connecter au serveur d'authentification.");
    }
  };

  // Admin Data Fetching
  const fetchUsersList = async () => {
    if (!token || currentUser?.role !== "admin") return;
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers(token);
      setUsers(data);
    } catch (err: any) {
      setApiError(err.message || "Échec de la connexion à la base de données.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogsList = async () => {
    if (!token || currentUser?.role !== "admin") return;
    setLoadingLogs(true);
    try {
      const data = await adminApi.getLogs(token);
      setLogs(data);
    } catch (err: any) {
      setApiError(err.message || "Échec de la connexion à la base de données.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsersList();
      fetchLogsList();
    }
  }, [currentUser]);

  // Admin User Action Handlers
  const validateNewUserForm = () => {
    const errors: Record<string, string> = {};
    if (!newUserForm.username.trim()) errors.username = "Requis";
    if (!newUserForm.email.trim()) {
      errors.email = "Requis";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserForm.email)) errors.email = "Format invalide";
    }
    if (!newUserForm.password) {
      errors.password = "Requis";
    } else if (newUserForm.password.length < 6) {
      errors.password = "Au moins 6 caractères";
    }
    setNewUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !validateNewUserForm()) return;

    setApiError(null);
    try {
      const data = await adminApi.createUser(token, newUserForm);
      setApiSuccess(`L'utilisateur '${data.username}' a été créé avec succès.`);
      setIsCreatingUser(false);
      setNewUserForm({ username: "", email: "", password: "", role: "user", status: "active" });
      fetchUsersList();
      fetchLogsList();
    } catch (err: any) {
      setApiError(err.message || "Échec de la création de l'utilisateur.");
    }
  };

  const validateEditUserForm = () => {
    const errors: Record<string, string> = {};
    if (!editUserForm.username.trim()) errors.username = "Requis";
    if (!editUserForm.email.trim()) {
      errors.email = "Requis";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editUserForm.email)) errors.email = "Format invalide";
    }
    setEditUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser || !validateEditUserForm()) return;

    setApiError(null);
    try {
      await adminApi.updateUser(token, editingUser.id, editUserForm);
      setApiSuccess("Le compte de l'utilisateur a été mis à jour avec succès.");
      setEditingUser(null);
      fetchUsersList();
      fetchLogsList();
    } catch (err: any) {
      setApiError(err.message || "Échec de la mise à jour de l'utilisateur.");
    }
  };

  const handleAdminToggleStatus = async (user: UserProfile) => {
    if (!token) return;
    const nextStatus = user.status === "active" ? "disabled" : "active";
    setApiError(null);
    try {
      await adminApi.updateUser(token, user.id, { status: nextStatus });
      setApiSuccess(
        `Le statut de l'utilisateur '${user.username}' a été modifié en ${
          nextStatus === "active" ? "actif" : "suspendu"
        }.`
      );
      fetchUsersList();
      fetchLogsList();
    } catch (err: any) {
      setApiError(err.message || "Échec de la modification du statut.");
    }
  };

  const handleAdminChangeRole = async (user: UserProfile, nextRole: string) => {
    if (!token) return;
    setApiError(null);
    try {
      await adminApi.updateUser(token, user.id, { role: nextRole });
      setApiSuccess(`Le rôle de l'utilisateur '${user.username}' a été modifié en ${nextRole}.`);
      fetchUsersList();
      fetchLogsList();
    } catch (err: any) {
      setApiError(err.message || "Échec de la mise à jour du rôle.");
    }
  };

  const handleAdminDeleteUser = async (userId: number, username: string) => {
    if (!token) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l'utilisateur '${username}' ? Cette action est irréversible.`
      )
    )
      return;

    setApiError(null);
    try {
      await adminApi.deleteUser(token, userId);
      setApiSuccess(`L'utilisateur '${username}' a été supprimé avec succès.`);
      fetchUsersList();
      fetchLogsList();
    } catch (err: any) {
      setApiError(err.message || "Échec de la suppression de l'utilisateur.");
    }
  };

  const startEditing = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setEditUserErrors({});
  };

  // Render Loading Overlay
  if (isAuthenticating) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-dracl-bg dark:bg-drac-bg text-dracl-fg dark:text-drac-fg font-sans flex flex-col select-none overflow-x-hidden">
      <div className="w-full flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* TOP SYSTEM BAR */}
        <Header
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onLogout={handleLogout}
        />

        {/* SYSTEM BANNERS & NOTIFICATIONS */}
        <NotificationBanner
          apiError={apiError}
          apiSuccess={apiSuccess}
          onClearError={() => setApiError(null)}
          onClearSuccess={() => setApiSuccess(null)}
        />

        {/* MAIN BODY LAYOUT */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {!currentUser ? (
            /* ANONYMOUS ACCESS VIEW */
            <LoginForm
              loginForm={loginForm}
              loginErrors={loginErrors}
              onFormChange={(fields) => setLoginForm({ ...loginForm, ...fields })}
              onSubmit={handleLoginSubmit}
            />
          ) : (
            /* LOGGED-IN VIEW STRUCTURE */
            <>
              {/* SIDEBAR NAVIGATION */}
              <Sidebar
                userRole={currentUser.role}
                adminTab={adminTab}
                userTab={userTab}
                onAdminTabChange={setAdminTab}
                onUserTabChange={setUserTab}
              />

              {/* MAIN WORKING CONTENT AREA */}
              <main className="flex-1 flex flex-col overflow-hidden bg-dracl-bg dark:bg-drac-bg">
                {currentUser.role === "admin" ? (
                  <>
                    {adminTab === "users" && (
                      <AdminUsers
                        users={users}
                        loadingUsers={loadingUsers}
                        currentUserId={currentUser.id}
                        isCreatingUser={isCreatingUser}
                        editingUser={editingUser}
                        newUserForm={newUserForm}
                        newUserErrors={newUserErrors}
                        editUserForm={editUserForm}
                        editUserErrors={editUserErrors}
                        onRefresh={fetchUsersList}
                        onToggleCreate={() => {
                          setIsCreatingUser(!isCreatingUser);
                          setEditingUser(null);
                        }}
                        onCloseCreate={() => setIsCreatingUser(false)}
                        onCloseEdit={() => setEditingUser(null)}
                        onNewUserFormChange={(fields) =>
                          setNewUserForm({ ...newUserForm, ...fields })
                        }
                        onEditUserFormChange={(fields) =>
                          setEditUserForm({ ...editUserForm, ...fields })
                        }
                        onAdminCreateUser={handleAdminCreateUser}
                        onAdminUpdateUser={handleAdminUpdateUser}
                        onAdminToggleStatus={handleAdminToggleStatus}
                        onAdminChangeRole={handleAdminChangeRole}
                        onAdminDeleteUser={handleAdminDeleteUser}
                        onStartEditing={startEditing}
                      />
                    )}

                    {adminTab === "matrix" && (
                      <PermissionsMatrix userRole={currentUser.role} isUserView={false} />
                    )}

                    {adminTab === "logs" && (
                      <AdminLogs
                        logs={logs}
                        loadingLogs={loadingLogs}
                        logFilter={logFilter}
                        logActionFilter={logActionFilter}
                        onLogFilterChange={setLogFilter}
                        onLogActionFilterChange={setLogActionFilter}
                        onRefresh={fetchLogsList}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {userTab === "host" && (
                      <UserWorkspace currentUser={currentUser} onLogout={handleLogout} />
                    )}

                    {userTab === "matrix" && (
                      <PermissionsMatrix userRole={currentUser.role} isUserView={true} />
                    )}
                  </>
                )}
              </main>
            </>
          )}
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <Footer />
      </div>
    </div>
  );
}
