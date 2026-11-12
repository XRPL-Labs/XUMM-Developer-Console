/**
 * The frame of the console: the sidebar (application switcher, the pages of the application), the top bar (theme, user).
 */
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Dialog, DialogBackdrop, DialogPanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { api, errorRef, safeUrl } from '../lib/api'
import { signOut } from '../lib/auth'
import { appPath, useSelectedApp, type AppSectionName } from '../lib/routes'
import { isAppOwner, useStore, type App } from '../lib/store'
import { useTheme, type Theme } from '../lib/theme'
import { toast } from '../lib/toast'
import { AppIcon, Badge, cx } from './ui'
import { XamanLogo } from './XamanLogo'
import {
  Icon,
  faArrowUpRightFromSquare,
  faBars,
  faBook,
  faCheck,
  faChevronDown,
  faCode,
  faCubes,
  faDesktop,
  faGear,
  faListUl,
  faMobileScreen,
  faMoon,
  faPlus,
  faRightFromBracket,
  faScrewdriverWrench,
  faSun,
  faTrophy,
  faUsers,
  faXmark,
  type IconDefinition,
} from './icons'

const menuPanel = 'z-40 rounded-xl border border-line bg-surface p-1 shadow-lg outline-none transition duration-100 data-[closed]:scale-95 data-[closed]:opacity-0'
const menuItem = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-fg-2 data-[focus]:bg-surface-3 data-[focus]:text-fg data-[disabled]:opacity-50'

const sections: { name: AppSectionName; label: string; icon: IconDefinition; ownerOnly?: boolean }[] = [
  { name: 'app-settings', label: 'Settings', icon: faGear },
  { name: 'app-revshare', label: 'Revshare', icon: faTrophy },
  { name: 'app-logs', label: 'Logs', icon: faListUl },
  { name: 'app-payloads', label: 'Payloads', icon: faCubes },
  { name: 'app-xapp', label: 'xApp', icon: faMobileScreen },
  { name: 'permissions', label: 'Permissions', icon: faUsers, ownerOnly: true },
]

// An application shared with the user (the user is not the owner) carries a dot
function AppAvatar({ app, size }: { app: App; size?: number }) {
  const user = useStore(s => s.user)
  return (
    <span className="relative inline-flex shrink-0">
      <AppIcon src={app.icon} size={size} />
      {!isAppOwner(app, user) && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-500 ring-2 ring-surface" title="Shared with you" />}
    </span>
  )
}

function AppSwitcher() {
  const applications = useStore(s => s.applications)
  const { appId, app, section } = useSelectedApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Menu>
      <MenuButton className="flex w-full items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-left shadow-sm outline-none hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
        {app ? (
          <>
            <AppAvatar app={app} size={28} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">{app.name}</span>
          </>
        ) : (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
              <Icon icon={faCubes} className="text-xs" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg-2">Select an app</span>
          </>
        )}
        <Icon icon={faChevronDown} className="shrink-0 text-[10px] text-muted" />
      </MenuButton>
      <MenuItems anchor={{ to: 'bottom start', gap: 6, padding: 8 }} transition className={cx(menuPanel, 'max-h-[70vh] w-72 origin-top overflow-y-auto')}>
        {Object.entries(applications).map(([id, a]) => (
          <MenuItem key={id} disabled={id === appId}>
            <button
              type="button"
              className={cx(menuItem, id === appId && 'font-semibold !opacity-100')}
              // The same page of the other application (the page of an application), else its settings
              onClick={() => navigate(appPath(id, appId && section ? section : 'app-settings'))}
            >
              <AppAvatar app={a} size={24} />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              {a.details.application_xapp_identifier && <Badge tone="brand">xApp</Badge>}
              {id === appId && <Icon icon={faCheck} className="text-xs text-brand-600 dark:text-brand-300" />}
            </button>
          </MenuItem>
        ))}
        {Object.keys(applications).length > 0 && <div className="my-1 border-t border-line" />}
        <MenuItem disabled={pathname === '/create-application'}>
          <button type="button" className={menuItem} onClick={() => navigate('/create-application')}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted">
              <Icon icon={faPlus} className="text-xs" />
            </span>
            Create new application
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

const navItem = (active: boolean) =>
  cx(
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]',
    active ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300' : 'text-fg-2 hover:bg-surface-3 hover:text-fg',
  )

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { appId, app, isOwner } = useSelectedApp()

  // The API reference is personal: the docs open with the credentials of the application filled in
  const openApiReference = async () => {
    // Opened at the click: a window opened after the call is a popup the browser blocks
    const tab = window.open('', '_blank')
    try {
      const url = safeUrl((await api('GET', 'console/docs-jwt/' + appId)).finalUrl)
      if (tab) {
        // The docs get no handle on the console
        tab.opener = null
        tab.location.href = url
      } else {
        window.location.href = url
      }
    } catch (e) {
      tab?.close()
      toast.error('Could not open the API reference' + errorRef(e))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Link to={appId ? appPath(appId) : '/'} onClick={onNavigate} className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4 outline-none">
        <XamanLogo className="h-[15px] text-fg" />
        <span className="mt-px rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">Developers</span>
      </Link>

      <div className="px-3 pt-4">
        <AppSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {app ? (
          <>
            <div className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wide text-faint uppercase">Application</div>
            <ul className="space-y-0.5">
              {sections
                .filter(s => !s.ownerOnly || isOwner)
                .map(s => (
                  <li key={s.name}>
                    <NavLink to={appPath(appId, s.name)} onClick={onNavigate} className={({ isActive }) => navItem(isActive)}>
                      <Icon icon={s.icon} className="w-4 text-[13px]" />
                      {s.label}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <ul className="space-y-0.5">
            <li>
              <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => navItem(isActive)}>
                <Icon icon={faCubes} className="w-4 text-[13px]" />
                Applications
              </NavLink>
            </li>
            <li>
              <NavLink to="/create-application" onClick={onNavigate} className={({ isActive }) => navItem(isActive)}>
                <Icon icon={faPlus} className="w-4 text-[13px]" />
                Create application
              </NavLink>
            </li>
          </ul>
        )}

        <div className="mt-6 mb-1.5 px-2.5 text-[11px] font-semibold tracking-wide text-faint uppercase">Docs &amp; Support</div>
        <ul className="space-y-0.5">
          <li>
            <a href="https://docs.xumm.dev" target="_blank" rel="noopener noreferrer" className={navItem(false)}>
              <Icon icon={faBook} className="w-4 text-[13px]" />
              Developer Docs
              <Icon icon={faArrowUpRightFromSquare} className="ml-auto text-[10px] text-faint" />
            </a>
          </li>
          {app && (
            <li>
              <button type="button" onClick={openApiReference} className={navItem(false)}>
                <Icon icon={faCode} className="w-4 text-[13px]" />
                API Reference
                <Icon icon={faArrowUpRightFromSquare} className="ml-auto text-[10px] text-faint" />
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}

const themes: { key: Theme; label: string; icon: IconDefinition }[] = [
  { key: 'system', label: 'System', icon: faDesktop },
  { key: 'light', label: 'Light', icon: faSun },
  { key: 'dark', label: 'Dark', icon: faMoon },
]

function ThemeMenu() {
  const { theme, setTheme } = useTheme()
  const current = themes.find(t => t.key === theme) || themes[0]

  return (
    <Menu>
      <MenuButton className="flex size-9 items-center justify-center rounded-lg text-muted outline-none hover:bg-surface-3 hover:text-fg focus-visible:ring-4 focus-visible:ring-[var(--ring)]" aria-label="Theme">
        <Icon icon={current.icon} />
      </MenuButton>
      <MenuItems anchor={{ to: 'bottom end', gap: 6, padding: 8 }} transition className={cx(menuPanel, 'w-40 origin-top-right')}>
        {themes.map(t => (
          <MenuItem key={t.key}>
            <button type="button" className={menuItem} onClick={() => setTheme(t.key)}>
              <Icon icon={t.icon} className="w-4 text-muted" />
              <span className="flex-1">{t.label}</span>
              {t.key === theme && <Icon icon={faCheck} className="text-xs text-brand-600 dark:text-brand-300" />}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

function UserMenu() {
  const user = useStore(s => s.user)
  const navigate = useNavigate()

  const name = String(user?.nickname || user?.name || user?.sub || '')
  const shortName = name.slice(0, 26).trim() + (name.length > 26 ? '…' : '')

  return (
    <Menu>
      <MenuButton className="flex h-9 items-center gap-2.5 rounded-lg pr-1.5 pl-2.5 text-[13px] font-medium text-fg-2 outline-none hover:bg-surface-3 hover:text-fg focus-visible:ring-4 focus-visible:ring-[var(--ring)]">
        <span className="max-w-48 truncate max-sm:hidden">{shortName}</span>
        <AppIcon src={user?.picture} size={26} className="!rounded-full" />
        <Icon icon={faChevronDown} className="text-[10px] text-muted" />
      </MenuButton>
      <MenuItems anchor={{ to: 'bottom end', gap: 6, padding: 8 }} transition className={cx(menuPanel, 'w-60 origin-top-right')}>
        <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
          <div className="text-xs text-muted">Signed in as</div>
          <div className="mt-0.5 truncate font-mono text-[12px] font-medium text-fg" title={user?.sub}>
            {user?.sub}
          </div>
        </div>
        <div className="pt-1">
          <MenuItem>
            <button type="button" className={menuItem} onClick={() => navigate('/manage-app-settings')}>
              <Icon icon={faScrewdriverWrench} className="w-4 text-muted" />
              Xaman App settings
            </button>
          </MenuItem>
          <MenuItem>
            <button type="button" className={menuItem} onClick={() => void signOut()}>
              <Icon icon={faRightFromBracket} className="w-4 text-muted" />
              Logout
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  )
}

export function Shell() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const { app, section } = useSelectedApp()

  useEffect(() => setDrawer(false), [pathname])

  const sectionLabel = sections.find(s => s.name === section)?.label

  return (
    <div className="min-h-full">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      <Dialog open={drawer} onClose={setDrawer} className="relative z-50 lg:hidden">
        <DialogBackdrop transition className="fixed inset-0 bg-slate-900/30 transition data-[closed]:opacity-0 dark:bg-black/55" />
        <DialogPanel
          transition
          className="fixed inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto overscroll-contain border-r border-line bg-surface pl-[env(safe-area-inset-left)] shadow-xl transition data-[closed]:-translate-x-full"
        >
          <button type="button" className="absolute top-3 right-3 rounded-md p-2 text-muted hover:bg-surface-3" onClick={() => setDrawer(false)} aria-label="Close menu">
            <Icon icon={faXmark} />
          </button>
          <SidebarContent onNavigate={() => setDrawer(false)} />
        </DialogPanel>
      </Dialog>

      <div className="flex min-h-dvh flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <button type="button" className="-ml-1.5 shrink-0 rounded-md p-2 text-muted hover:bg-surface-3 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Icon icon={faBars} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
            {app ? (
              <>
                <span className="truncate font-semibold text-fg">{app.name}</span>
                {sectionLabel && (
                  <>
                    <span className="text-faint">/</span>
                    <span className="truncate text-muted">{sectionLabel}</span>
                  </>
                )}
              </>
            ) : (
              <span className="truncate font-semibold text-fg">Developer Console</span>
            )}
          </div>
          <ThemeMenu />
          <UserMenu />
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
