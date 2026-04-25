import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '선거 알림 시스템',
  description: '중앙선거관리위원회 게시판 참관인 알림',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
