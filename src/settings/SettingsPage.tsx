import { ItemsSection, type ItemsSectionProps } from '../items/ItemsSection.tsx'
import { GeneralSection, type GeneralSectionProps } from './GeneralSection.tsx'

interface SettingsPageProps {
  items: Omit<ItemsSectionProps, 't'>
  general: Omit<GeneralSectionProps, 't'>
  t: ItemsSectionProps['t']
}

/** The fourth swipe page: the Operator's Items (the Catalog), then the General settings below them. */
export function SettingsPage({ items, general, t }: SettingsPageProps) {
  return (
    <section className="page" aria-labelledby="settings-page-title">
      <h1 className="page-title" id="settings-page-title">
        {t.settings}
      </h1>
      <ItemsSection {...items} t={t} />
      <GeneralSection {...general} t={t} />
    </section>
  )
}
