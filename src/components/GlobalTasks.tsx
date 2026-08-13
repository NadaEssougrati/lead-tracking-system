/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  User,
  Building,
  Search,
  Plus,
  CheckCircle,
  CheckSquare2,
  Square,
  PlayCircle,
  Trash2,
  Pencil,
  X,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { Task, Lead, TaskStatus, User as UserType, LeadStatus, TaskType } from "../types";
import { usePreferences } from "../AppPreferences";

interface GlobalTasksProps {
  tasks: Task[];
  leads: Lead[];
  users: UserType[];
  activeLeadId?: string;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task> & { utilisateurId?: string }) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (task: Omit<Task, "id">) => void;
}

export default function GlobalTasks({
  tasks,
  leads,
  users,
  activeLeadId,
  onUpdateTaskStatus = () => {},
  onUpdateTask = () => {},
  onDeleteTask = () => {},
  onAddTask = () => {}
}: GlobalTasksProps) {
  const { t } = usePreferences();
  const [searchTerm, setSearchTerm] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState<string>("statut");
  const [secondaryFilter, setSecondaryFilter] = useState<string>("all");
  const [newTitre, setNewTitre] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLeadId, setNewLeadId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newAssigned, setNewAssigned] = useState("");
  const [newCritique, setNewCritique] = useState(false);
  const [newType, setNewType] = useState<TaskType>(TaskType.OTHER);
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);
  const [taskFeedbackType, setTaskFeedbackType] = useState<"success" | "error">("success");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitre, setEditTitre] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [editCritique, setEditCritique] = useState(false);
  const [editStatus, setEditStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [editType, setEditType] = useState<TaskType>(TaskType.OTHER);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitre.trim() || !newLeadId) return;

    try {
      await onAddTask({
        leadId: newLeadId,
        titre: newTitre.trim(),
        description: newDesc,
        statut: TaskStatus.TODO,
        dateEcheance: newDate || new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        assigneA: newAssigned ? (users.find(u => u.id === newAssigned)?.nom || "") : "",
        utilisateurId: newAssigned || undefined,
        critique: newCritique,
        type: newType,
      });

      setTaskFeedback(t("tasks.created"));
      setTaskFeedbackType("success");
      setNewTitre("");
      setNewDesc("");
      setNewLeadId("");
      setNewDate("");
      setNewAssigned("");
      setNewCritique(false);
      setNewType(TaskType.OTHER);
    } catch (err) {
      setTaskFeedback(err instanceof Error ? err.message : t("tasks.createError"));
      setTaskFeedbackType("error");
    }
    setTimeout(() => setTaskFeedback(null), 4000);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitre(task.titre);
    setEditDesc(task.description || "");
    setEditDate(task.dateEcheance);
    setEditAssigned(task.utilisateurId || "");
    setEditCritique(task.critique);
    setEditStatus(task.statut);
    setEditType(task.type || TaskType.OTHER);
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await onUpdateTask(editingTask.id, {
        titre: editTitre.trim(),
        description: editDesc,
        dateEcheance: editDate,
        utilisateurId: editAssigned || undefined,
        assigneA: editAssigned ? (users.find(u => u.id === editAssigned)?.nom || "") : editingTask.assigneA,
        critique: editCritique,
        statut: editStatus,
        type: editType,
      });

      setTaskFeedback(t("tasks.updated"));
      setTaskFeedbackType("success");
      setEditingTask(null);
    } catch (err) {
      setTaskFeedback(err instanceof Error ? err.message : t("tasks.updateError"));
      setTaskFeedbackType("error");
    }
    setTimeout(() => setTaskFeedback(null), 4000);
  };

  const closeEditModal = () => {
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(t("tasks.deleteConfirm"))) {
      onDeleteTask(taskId);
    }
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.societe : t("tasks.unknownClient");
  };

  const getTaskTypeBadge = (type?: TaskType) => {
    const tType = type || TaskType.OTHER;
    switch (tType) {
      case TaskType.CALL:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
            <Phone className="h-3 w-3" /> {t("lead.type.call") || "Appel"}
          </span>
        );
      case TaskType.EMAIL:
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
            <Mail className="h-3 w-3" /> {t("lead.type.email") || "Email"}
          </span>
        );
      case TaskType.MEETING:
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-250/70 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900">
            <Calendar className="h-3 w-3" /> {t("lead.type.meeting") || "Rendez-vous"}
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            {t("lead.type.other") || "Autre"}
          </span>
        );
    }
  };

  const visibleTasks = tasks.filter((t) => leads.some((l) => l.id === t.leadId));
  const clientOptions = leads.map((l) => ({ value: l.id, label: `${l.societe} (${l.prenom} ${l.nom})` }));
  const statusOptions = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const priorityOptions = [
    { value: "all", label: t("tasks.all") },
    { value: "critique", label: t("tasks.criticalOnly") },
    { value: "normal", label: t("tasks.standard") }
  ];

const filterValues = () => {
    if (primaryFilter === "client") return [{ value: "all", label: t("tasks.all") }, ...clientOptions];
    if (primaryFilter === "priorite") return priorityOptions;
    if (primaryFilter === "etat") return [{ value: "all", label: t("tasks.all") }, ...Object.values(LeadStatus).map((item) => ({ value: item, label: item }))];
    return [{ value: "all", label: t("tasks.all") }, ...statusOptions.map((item) => ({ value: item, label: item }))];
  };

  const filteredTasks = visibleTasks.filter((task) => {
    const leadName = getLeadName(task.leadId);
    const taskLead = leads.find((l) => l.id === task.leadId);
    const matchesSearch =
      task.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigneA.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSecondary =
      secondaryFilter === "all" ||
      (primaryFilter === "client" && task.leadId === secondaryFilter) ||
      (primaryFilter === "priorite" && secondaryFilter === "critique" ? task.critique : primaryFilter === "priorite" ? !task.critique : false) ||
      (primaryFilter === "statut" && task.statut === secondaryFilter) ||
      (primaryFilter === "etat" && taskLead?.statut === secondaryFilter);

    const matchesLeadSelection = activeLeadId ? task.leadId === activeLeadId : true;
    return matchesSearch && matchesSecondary && matchesLeadSelection;
  });

  const todoCount = visibleTasks.filter(t => t.statut === TaskStatus.TODO).length;
  const inProgressCount = visibleTasks.filter(t => t.statut === TaskStatus.IN_PROGRESS).length;
  const doneCount = visibleTasks.filter(t => t.statut === TaskStatus.DONE).length;

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-screen text-slate-850 dark:bg-slate-950" id="global-tasks-root">
      <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t("tasks.total")}</p>
            <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">{visibleTasks.length}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t("tasks.todo")}</p>
            <h3 className="text-2xl font-bold font-display text-rose-600 mt-1">{todoCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t("tasks.inProgress")}</p>
            <h3 className="text-2xl font-bold font-display text-amber-600 mt-1">{inProgressCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
            <PlayCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{t("tasks.done")}</p>
            <h3 className="text-2xl font-bold font-display text-emerald-600 mt-1">{doneCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-blue-600" />
              {t("tasks.create")}
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.title")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("tasks.titlePlaceholder")}
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.client")}</label>
                <select
                  required
                  value={newLeadId}
                  onChange={(e) => setNewLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none"
                >
                  <option value="">{t("tasks.chooseClient")}</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.societe} ({l.prenom} {l.nom})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.deadline")}</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.assigned")}</label>
                  <select
                    value={newAssigned}
                    onChange={(e) => setNewAssigned(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="">{t("tasks.chooseUser")}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Type de tâche</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TaskType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 cursor-pointer text-xs focus:bg-white focus:outline-none"
                >
                  <option value={TaskType.CALL}>Appeler</option>
                  <option value={TaskType.EMAIL}>Envoyer un email</option>
                  <option value={TaskType.MEETING}>Rendez-vous</option>
                  <option value={TaskType.OTHER}>Autre / Relance</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.notes")}</label>
                <textarea
                  rows={3}
                  placeholder={t("tasks.notesPlaceholder")}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="critique-task"
                  checked={newCritique}
                  onChange={(e) => setNewCritique(e.target.checked)}
                  className="h-4 w-4 bg-white rounded border-slate-300 text-blue-600 cursor-pointer"
                />
                <label htmlFor="critique-task" className="text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
                  {t("tasks.markCritical")}
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold uppercase tracking-wide text-[10px] transition-all shadow-md shadow-blue-500/10"
              >
                {t("tasks.plan")}
              </button>

              {taskFeedback && (
                <p className={`text-[11px] font-semibold p-2 rounded-lg ${
                  taskFeedbackType === "success"
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                    : "text-rose-700 bg-rose-50 border border-rose-100"
                }`}>
                  {taskFeedback}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs shadow-sm">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("tasks.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <select
                value={primaryFilter}
                onChange={(e) => {
                  setPrimaryFilter(e.target.value);
                  setSecondaryFilter("all");
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 font-semibold cursor-pointer text-xs focus:ring-0 w-full sm:w-auto focus:bg-white"
              >
                <option value="statut">{t("tasks.filterStatus")}</option>
                <option value="client">{t("tasks.filterClient")}</option>
                <option value="priorite">{t("tasks.filterPriority")}</option>
                <option value="etat">{t("tasks.filterState")}</option>
              </select>

              <select
                value={secondaryFilter}
                onChange={(e) => setSecondaryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 font-semibold cursor-pointer text-xs focus:ring-0 w-full sm:w-auto focus:bg-white"
              >
                {filterValues().map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
                {t("tasks.empty")}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const leadName = getLeadName(task.leadId);
                const isTodo = task.statut === TaskStatus.TODO;
                const isInProgress = task.statut === TaskStatus.IN_PROGRESS;
                const isDone = task.statut === TaskStatus.DONE;

                return (
                  <div
                    key={task.id}
                    className={`bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3.5 hover:border-slate-350 transition-all text-xs shadow-sm ${isDone ? "opacity-60" : ""}`}
                  >
                    <button
                      onClick={() => {
                        const nextStatus = isTodo
                          ? TaskStatus.IN_PROGRESS
                          : isInProgress
                            ? TaskStatus.DONE
                            : TaskStatus.TODO;
                        onUpdateTaskStatus(task.id, nextStatus);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title={t("tasks.changeStatus")}
                    >
                      {isDone ? (
                        <CheckSquare2 className="h-5 w-5 text-emerald-600" />
                      ) : isInProgress ? (
                        <PlayCircle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-300" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`font-bold text-slate-800 text-xs ${isDone ? "line-through text-slate-400" : ""}`}>
                          {task.titre}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {task.critique && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> {t("tasks.critical")}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isDone ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : isInProgress ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                            {task.statut}
                          </span>
                          {getTaskTypeBadge(task.type)}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 items-center text-[10px] text-slate-400 pt-1.5">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Building className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-slate-700">{leadName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{t("tasks.assigned")} <strong className="text-slate-700">{task.assigneA}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{t("tasks.deadline")} <strong className="text-slate-700">{new Date(task.dateEcheance).toLocaleDateString("fr-FR")}</strong></span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditTask(task)}
                            className="text-slate-500 hover:text-blue-600 rounded-full p-1 transition-colors"
                            title={t("tasks.editTask")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-rose-500 hover:text-rose-700 rounded-full p-1 transition-colors"
                            title={t("tasks.deleteTask")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">{t("tasks.editModalTitle")}</h3>
              <button type="button" onClick={closeEditModal} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.taskTitle")}</label>
                <input
                  value={editTitre}
                  onChange={(e) => setEditTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("common.description")}</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.deadline")}</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("tasks.assigned")}</label>
                  <select
                    value={editAssigned}
                    onChange={(e) => setEditAssigned(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">{t("tasks.noAssignee")}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">{t("common.status")}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value={TaskStatus.TODO}>{t("tasks.todo")}</option>
                    <option value={TaskStatus.IN_PROGRESS}>{t("tasks.inProgress")}</option>
                    <option value={TaskStatus.DONE}>{t("tasks.done")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Type de tâche</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as TaskType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={TaskType.CALL}>Appeler</option>
                    <option value={TaskType.EMAIL}>Envoyer un email</option>
                    <option value={TaskType.MEETING}>Rendez-vous</option>
                    <option value={TaskType.OTHER}>Autre / Relance</option>
                  </select>
                </div>
                <div className="pb-2.5">
                  <label className="flex items-center gap-2 text-[11px] text-slate-605">
                    <input
                      type="checkbox"
                      checked={editCritique}
                      onChange={(e) => setEditCritique(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {t("tasks.markPriority")}
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeEditModal} className="text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                  {t("common.cancel")}
                </button>
                <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-500">
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
