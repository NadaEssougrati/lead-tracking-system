import { kpiRepository, GlobalMetrics, StatusMetric, SourceMetric, CommercialPerformance } from "../repositories/kpiRepository.ts";
import { AuthorizationError } from "./entrepriseService.ts";

export interface DashboardKPIs {
  global: GlobalMetrics;
  byStatus: StatusMetric[];
  bySource: SourceMetric[];
  commercialPerformance: CommercialPerformance[];
}

export const kpiService = {
  /**
   * Retrieves dashboard statistics and KPIs for team performance.
   * RBAC Enforcement: Restricted strictly to Administrateur and Manager.
   */
  async getDashboardKPIs(user: { id: number; role: string }): Promise<DashboardKPIs> {
    const allowedRoles = ["Administrateur", "Manager"];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new AuthorizationError("Accès refusé. Seuls les Administrateurs et Managers peuvent visualiser les KPIs d'équipe.");
    }

    const [global, byStatus, bySource, commercialPerformance] = await Promise.all([
      kpiRepository.getGlobalMetrics(),
      kpiRepository.getLeadsCountByStatus(),
      kpiRepository.getLeadsCountBySource(),
      kpiRepository.getCommercialPerformance(),
    ]);

    return {
      global,
      byStatus,
      bySource,
      commercialPerformance,
    };
  },
};
