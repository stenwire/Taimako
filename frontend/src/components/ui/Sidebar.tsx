import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, collapsed = false }) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex flex-col h-full py-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && !collapsed && (
              <h3 className="text-h3 px-4 mb-2">{section.title}</h3>
            )}
            <nav className="space-y-1 px-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-200',
                      'text-[14px] font-medium',
                      isActive
                        ? 'bg-[var(--bg-primary)] text-[var(--brand-primary)] shadow-[var(--shadow-sm)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]')} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
