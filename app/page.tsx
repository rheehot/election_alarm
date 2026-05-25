export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-4">
          블로그 이벤트 검색 알림 시스템
        </h1>
        <p className="text-gray-600 text-center mb-6">
          네이버 블로그에서 &quot;이벤트&quot; 키워드로 검색된 포스트를
          자동으로 모니터링하여 이메일로 알림을 발송합니다.
        </p>

        <div className="space-y-4">
          <a
            href="/api/health"
            className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition"
          >
            건강 상태 확인
          </a>
          <a
            href="/api/check-board"
            className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition"
          >
            블로그 검색 (수동 실행)
          </a>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <h2 className="font-semibold mb-2">설정된 환경변수:</h2>
          <ul className="space-y-1">
            <li>• 실행 주기: 매일 자정 (Vercel Cron)</li>
            <li>• 검색 키워드: 이벤트</li>
            <li>• 검색 대상: 네이버 블로그</li>
            <li>• 이메일 방식: Resend API</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
