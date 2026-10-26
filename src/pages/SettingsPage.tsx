import { AppLayout } from '@/components/layout/AppLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { TeamSettings } from '@/components/settings/TeamSettings'
import { PipelineSettings } from '@/components/settings/PipelineSettings'
import { PreferencesSettings } from '@/components/settings/PreferencesSettings'
import { DataManagementSettings } from '@/components/settings/DataManagementSettings'
import { useAuth } from '@/auth/useAuth'

export function SettingsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <AppLayout title="Settings">
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          {isAdmin && <TabsTrigger value="pipeline">Pipeline</TabsTrigger>}
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="pipeline">
            <PipelineSettings />
          </TabsContent>
        )}
        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>
        <TabsContent value="data">
          <DataManagementSettings />
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
