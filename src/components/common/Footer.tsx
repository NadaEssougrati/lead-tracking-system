import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200/60 dark:border-neutral-800/40 p-3 bg-dracl-sub dark:bg-drac-sub flex justify-between items-center text-[10px] font-mono text-dracl-muted dark:text-drac-comment shrink-0">
      <div className="flex gap-4">
        <span>DB: POSTGRESQL@LEAD_MAN</span>
        <span>JWT: HS256_ACTIVE</span>
        <span>NODE_ENV: PRODUCTION</span>
      </div>
      <div>VERSION_4.1.2_STABLE</div>
    </footer>
  );
};
