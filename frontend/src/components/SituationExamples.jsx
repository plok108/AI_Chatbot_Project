// src/components/SituationExamples.jsx
import React, { useRef, useState, useEffect } from 'react';

function SituationExamples() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const examples = ["다이어트 중", "단 게 땡겨요", "야식이 먹고 싶어요", "속이 안 좋아요", "스트레스 받았어요", "시간이 없어요"];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });

  // 🌟 화살표 위치 커스텀 함수
  const arrowWrapperStyle = (side) => ({
    position: 'absolute',
    [side]: '-15px',
    
    /* ---------------------------------------------------------
       📍 수동 조정 포인트! 
       아래 '26px' 숫자를 25, 27, 28 등으로 바꿔보면서 높이를 맞춰보세요.
       숫자가 커지면 화살표가 내려가고, 작아지면 올라갑니다.
    ---------------------------------------------------------- */
    top: '-7px', 
    
    display: 'flex',
    alignItems: 'center',
    zIndex: 10
  });

  const arrowButtonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '16px',
    color: '#555'
  };

  return (
    <div style={{ width: '100%', maxWidth: '840px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '16px', marginLeft: '4px', textAlign: 'left', fontWeight: 'bold' }}>
        이런 상황은 어때요?
      </h3>
      
      <div style={{ position: 'relative', width: '100%' }}>
        
        {/* 왼쪽 화살표 */}
        {showLeft && (
          <div style={arrowWrapperStyle('left')}>
            <button onClick={scrollLeft} style={arrowButtonStyle}>&lt;</button>
          </div>
        )}
        
        {/* 스크롤 영역 */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll} 
          style={{ 
            display: 'flex', 
            gap: '10px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            padding: '10px 20px', // 여백을 넉넉히 주어 화살표가 가리지 않게 함
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {examples.map((text, idx) => (
            <div key={idx} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#444',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#444'; }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* 오른쪽 화살표 */}
        {showRight && (
          <div style={arrowWrapperStyle('right')}>
            <button onClick={scrollRight} style={arrowButtonStyle}>&gt;</button>
          </div>
        )}
      </div>
      
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

export default SituationExamples;