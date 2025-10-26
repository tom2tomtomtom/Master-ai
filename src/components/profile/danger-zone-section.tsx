'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface DangerZoneSectionProps {
  profile: {
    email: string
  }
  onDeleteAccount: (deleteForm: { confirmEmail: string; confirmText: string }) => Promise<void>
  isDeletingAccount: boolean
}

export function DangerZoneSection({ profile, onDeleteAccount, isDeletingAccount }: DangerZoneSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteForm, setDeleteForm] = useState({
    confirmEmail: '',
    confirmText: ''
  })

  const handleDeleteAccount = async () => {
    await onDeleteAccount(deleteForm)
    setDeleteDialogOpen(false)
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account, 
            all your progress, notes, and any associated data.
          </p>
        </div>
        
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Please confirm that you want to permanently delete your account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirmEmail">Confirm your email address</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={deleteForm.confirmEmail}
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                  placeholder={profile.email}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmText">
                  Type <strong>DELETE MY ACCOUNT</strong> to confirm
                </Label>
                <Input
                  id="confirmText"
                  value={deleteForm.confirmText}
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || !deleteForm.confirmEmail || deleteForm.confirmText !== 'DELETE MY ACCOUNT'}
              >
                {isDeletingAccount ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}