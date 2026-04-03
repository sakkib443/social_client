export function PostCardSkeleton() {
  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      {/* Header Skeleton */}
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb' }} />
          <div>
            <div style={{ height: 14, width: 128, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: 96, background: '#e5e7eb', borderRadius: 4 }} />
          </div>
        </div>

        {/* Content Skeleton */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 14, width: '100%', background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: '75%', background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: '50%', background: '#e5e7eb', borderRadius: 4 }} />
        </div>

        {/* Image Skeleton */}
        <div style={{ width: '100%', height: 200, background: '#e5e7eb', borderRadius: 8, marginBottom: 16 }} />
      </div>

      {/* Actions Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 24px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ height: 32, width: 96, background: '#e5e7eb', borderRadius: 4 }} />
        <div style={{ height: 32, width: 96, background: '#e5e7eb', borderRadius: 4 }} />
      </div>
    </div>
  );
}
