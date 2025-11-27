import React, { useState, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop';

interface MemberData {
  id: number;
  full_name?: string;
  plan?: string;
  start_date?: string | null;
  end_date?: string | null;
  phone?: string | null;
  notes?: string | null;
  renewals?: number;
  status?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface PageProps {
  user: UserData;
  member: MemberData | null;
  avatarUrl?: string | null;
}

export default function MemberProfile({ user, member, avatarUrl }: PageProps) {
  const csrf = (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)?.content || '';
  const page: any = usePage();
  const success: string | undefined = page?.props?.flash?.success;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setUploadError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropModal(true);
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (): Promise<Blob> => {
    if (!previewUrl || !croppedAreaPixels) {
      throw new Error('No image or crop data available.');
    }
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get canvas context.');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }, [previewUrl, croppedAreaPixels]);

  const handleConfirmCrop = async () => {
    if (!selectedFile || !previewUrl || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      const blob = await createCroppedImage();
      const croppedFile = new File([blob], selectedFile.name || 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('_token', csrf);
      formData.append('avatar', croppedFile);

      const response = await fetch('/member/update-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      // Show success modal before reload
      setShowSuccessModal(true);
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      setUploading(false);
      setUploadError(err?.message || 'Something went wrong while uploading.');
    }
  };

  return (
    <>
      <Head title="Profile" />
      <div className="min-h-screen bg-slate-950 text-gray-100">
        <header className="border-b border-gray-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Profile</h1>
            <div className="space-x-2">
              <Link href="/member/home" className="rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm text-gray-200 transition-colors">Back</Link>
              <form method="post" action="/logout" className="inline">
                <input type="hidden" name="_token" value={csrf} />
                <button type="submit" className="rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm text-gray-200 transition-colors ml-2">Logout</button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {success && (
            <div className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-emerald-200">
              {success}
            </div>
          )}
          <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="flex flex-col items-center">
                  <div className="h-36 w-36 rounded-full overflow-hidden border border-gray-700 bg-slate-800/50">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-content-center text-5xl bg-slate-800/50">👤</div>
                    )}
                  </div>
                  <div className="mt-4 w-full flex flex-col items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-auto text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-blue-500 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-700/30 file:cursor-pointer"
                    />
                    {uploadError && (
                      <div className="text-xs text-red-300 mt-1 text-center max-w-xs">{uploadError}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3 grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <label className="text-xs text-gray-400">Name</label>
                    <div className="text-sm text-gray-200">{user.name}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <div className="text-sm">{user.email}</div>
                  </div>
                </div>
                {member && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">Phone</label>
                      <div className="text-sm">{member.phone || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Plan</label>
                      <div className="text-sm">{member.plan || '—'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Start Date</label>
                      <div className="text-sm">{member.start_date || '—'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">End Date</label>
                      <div className="text-sm">{member.end_date || '—'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Renewals</label>
                      <div className="text-sm">{member.renewals ?? 0} times</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
            <h3 className="mb-4 text-lg font-semibold">Change Password</h3>
            <form method="post" action="/member/update-password" className="space-y-3 max-w-2xl">
              <input type="hidden" name="_token" value={csrf} />
              <div>
                <label className="block text-xs text-gray-400 mb-1">Current Password</label>
                <input name="current_password" type="password" required className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">New Password</label>
                  <input name="password" type="password" required minLength={8} className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                  <input name="password_confirmation" type="password" required minLength={8} className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">Update Password</button>
              <div className="text-xs text-gray-500">Minimum 8 characters.</div>
            </form>
          </div>
          {showCropModal && previewUrl && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
                <h4 className="text-sm font-semibold text-gray-100 mb-2">Crop profile photo</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Drag and zoom to adjust the crop area, then save.
                </p>
                <div className="relative h-64 w-full mb-4 rounded-lg overflow-hidden bg-slate-950">
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-400 block mb-1">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelCrop}
                    disabled={uploading}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-gray-200 hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCrop}
                    disabled={uploading}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-60 cursor-pointer"
                  >
                    {uploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="w-full max-w-sm rounded-2xl border border-emerald-600/40 bg-emerald-900/90 p-6 shadow-xl text-center">
                <div className="text-3xl mb-3">✅</div>
                <h4 className="text-base font-semibold text-emerald-100 mb-1">Profile photo uploaded!</h4>
                <p className="text-xs text-emerald-200 mb-4">Your new photo is now live.</p>
                <div className="text-xs text-emerald-300 opacity-60">Refreshing...</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
