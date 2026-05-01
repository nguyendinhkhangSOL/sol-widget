import { Link } from 'react-router-dom';

export function SosCard() {
  return (
    <>
      <div className="text-[11px] uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,.55)' }}>
        Hỗ trợ khẩn cấp
      </div>
      <div
        className="rounded-[13px] p-3.5"
        style={{
          border: '1.5px solid rgba(212,96,74,.35)',
          background: 'rgba(212,96,74,.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#D4604A', boxShadow: '0 0 8px rgba(212,96,74,.8)', animation: 'sol-pulse 1.5s infinite' }}
          />
          <style>{`@keyframes sol-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
          <span className="text-[13px] font-medium" style={{ color: '#F5A090' }}>
            Đang thèm thuốc?
          </span>
          <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,.7)' }}>
            Cơn thèm chỉ 3–5 phút
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <SosButton icon="🎧" title="Thở 4-7-8" sub="Audio · 4 phút" onClick={() => alert('🎧 Thở 4-7-8\n\nHít vào: 4 giây\nNín thở: 7 giây\nThở ra: 8 giây\n\nLàm 3 lần — cơn thèm sẽ qua.')} />
          <Link to="/journey" className="block">
            <div className="rt-sos-opt cursor-pointer" style={sosOptStyle}>
              <span className="text-[17px] block mb-1">💬</span>
              <strong className="block text-[12px] font-medium" style={{ color: 'rgba(255,255,255,.92)' }}>
                Chat mentor
              </strong>
              <small className="text-[10px]" style={{ color: 'rgba(255,255,255,.72)' }}>
                Phản hồi ngay
              </small>
            </div>
          </Link>
          <SosButton icon="🚶" title="Đứng dậy đi" sub="Cắt vòng lặp" onClick={() => alert('🚶 Đứng dậy ngay!\n\nĐi bộ 5 phút — ra ngoài nếu có thể.\nThay đổi không gian vật lý cắt đứt vòng lặp kích hoạt cơn thèm.')} />
          <SosButton icon="👨‍👩‍👧" title="Nhớ lý do" sub="Nội lực sâu nhất" onClick={() => alert('💝 Nhớ lại lý do bạn bắt đầu\n\nKhoảnh khắc bạn đã chọn để thay đổi.\nĐây là nội lực thật sự của bạn.')} />
        </div>
        <div className="text-center text-[11px] mt-2.5" style={{ color: 'rgba(255,255,255,.65)' }}>
          Hotline miễn phí: <b style={{ color: '#F5A090' }}>1800 599 920</b> · 24/7
        </div>
      </div>
    </>
  );
}

const sosOptStyle: React.CSSProperties = {
  padding: '11px',
  borderRadius: 9,
  border: '1px solid rgba(255,255,255,.08)',
  background: 'rgba(255,255,255,.04)',
  textAlign: 'left',
};

function SosButton({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={sosOptStyle} className="hover:bg-white/10 transition">
      <span className="text-[17px] block mb-1">{icon}</span>
      <strong className="block text-[12px] font-medium" style={{ color: 'rgba(255,255,255,.92)' }}>
        {title}
      </strong>
      <small className="text-[10px]" style={{ color: 'rgba(255,255,255,.72)' }}>
        {sub}
      </small>
    </button>
  );
}
