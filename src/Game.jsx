import { useEffect, useRef, useState } from "react";
import "./Game.css";

// Câu hỏi theo yêu cầu
const questions = [
  {
    id: 1,
    vi: "Ba người cùng cấp, cùng độ tuổi",
    zh: "三个人同级别，年龄差不超过一岁",
    faces: [4, 5, 6],
  },
  {
    id: 2,
    vi: "Hai người trùng tên, khác tuổi mụ",
    zh: "两个人同名，但属相不同",
    faces: [1, 3],
  },
  {
    id: 3,
    vi: "Hai người cùng cấp, cùng công ty",
    zh: "两个人同级别、同公司",
    faces: [7, 8],
  },
  {
    id: 4,
    vi: "Hai người cùng ghế, khác thời điểm",
    zh: "两个人在不同时间坐过同一把椅子",
    faces: [2, 9],
  },
];

// Vị trí preset theo ảnh thật (đơn vị %)
const positions = [
  { id: 1, left: 22.181818181818183, top: 47.25252525252525 },
  { id: 2, left: 30.181818181818183, top: 45.63636363636363 },
  { id: 3, left: 37.63636363636363, top: 45.31313131313131 },
  { id: 4, left: 45.27272727272727, top: 43.696969696969695 },
  { id: 5, left: 53, top: 46.12121212121212 },
  { id: 6, left: 59.27272727272728, top: 43.37373737373738 },
  { id: 7, left: 67.0909090909091, top: 44.666666666666664 },
  { id: 8, left: 75, top: 43.53535353535353 },
  { id: 9, left: 82.27272727272728, top: 44.666666666666664 },
];

// (tuỳ chọn) 9 emoji khác nhau cho vui mắt
const emojis = ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉"];

export default function Game() {
  const [revealed, setRevealed] = useState([]); // mặt đã mở
  const [hidden, setHidden] = useState({}); // icon đã ẩn hẳn sau fade
  const [justRevealed, setJustRevealed] = useState([]); // mặt vừa mở -> highlight
  const [step, setStep] = useState(0); // câu hiện tại (0..3)

  // Audio
  const [ready, setReady] = useState(false); // đã bấm "Bắt đầu"
  const [bgmOn, setBgmOn] = useState(true);
  const bgmRef = useRef(null);
  const correctRef = useRef(null);

  // Sau khi mặt được mở, 0.7s sau thì remove hẳn icon số
  useEffect(() => {
    revealed.forEach((id) => {
      if (!hidden[id]) {
        const t = setTimeout(() => {
          setHidden((prev) => ({ ...prev, [id]: true }));
        }, 700);
        return () => clearTimeout(t);
      }
    });
  }, [revealed, hidden]);

  // Start: yêu cầu user click để bật audio
  const handleStart = async () => {
    setReady(true);
    try {
      if (bgmRef.current) {
        bgmRef.current.volume = 0.4;
        await bgmRef.current.play();
      }
    } catch (e) {
      // Nếu trình duyệt chặn, cho phép user bật thủ công
      console.warn("Autoplay blocked:", e);
    }
  };

  // Toggle nhạc nền
  const toggleBgm = async () => {
    if (!bgmRef.current) return;
    if (bgmOn) {
      bgmRef.current.pause();
      setBgmOn(false);
    } else {
      try {
        await bgmRef.current.play();
        setBgmOn(true);
      } catch (e) {
        console.warn("Play BGM blocked:", e);
      }
    }
  };

  // Mở gương mặt theo câu hỏi hiện tại + phát âm correct
  const handleReveal = async () => {
    const newFaces = questions[step].faces;
    setRevealed((prev) => [...new Set([...prev, ...newFaces])]);
    setJustRevealed(newFaces);

    // Phát âm "correct"
    try {
      if (correctRef.current) {
        correctRef.current.currentTime = 0;
        await correctRef.current.play();
      }
    } catch (e) {
      console.warn("Play correct blocked:", e);
    }

    // Bỏ highlight sau 1.5s
    setTimeout(() => setJustRevealed([]), 1500);

    // Chuyển câu sau ~0.8s (khi fade gần xong)
    setTimeout(() => setStep((s) => s + 1), 800);
  };

  const resetGame = () => {
    setRevealed([]);
    setHidden({});
    setJustRevealed([]);
    setStep(0);
  };

  return (
    <div className="game-root">
      {/* Audio elements */}
      <audio
        ref={bgmRef}
        src={`${import.meta.env.BASE_URL}audio/bgm - cut.mp3`}
        loop
        preload="auto"
      />
      <audio
        ref={correctRef}
        src={`${import.meta.env.BASE_URL}audio/correct - cut.mp3`}
        preload="auto"
      />

      {/* Thanh tiêu đề câu hỏi kiểu 'Ai là triệu phú' */}
      <div className="millionaire-topbar">
        {step < questions.length ? (
          <div className="question-pill">
            <div className="question-number">CÂU {questions[step].id}</div>
            <div className="question-lines">
              <div className="q-vi">{questions[step].vi}</div>
              <div className="q-zh">{questions[step].zh}</div>
            </div>
          </div>
        ) : (
          <div className="question-pill done">🎉 Hoàn thành trò chơi!</div>
        )}
      </div>

      {/* Ảnh + overlay */}
      <div className="photo-wrapper">
        <img
          src={`${import.meta.env.BASE_URL}group.png`}
          alt="Group"
          className="group-photo"
        />

        <div className="overlay">
          {positions.map(({ id, left, top }) => {
            const isRevealed = revealed.includes(id);
            const fullyHidden = hidden[id];
            const isNew = justRevealed.includes(id);

            return (
              <div
                key={id}
                className="hotspot"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                {isNew && <div className="highlight-ring" />}
                {!fullyHidden && (
                  <div className={`mask ${isRevealed ? "fade-out" : ""}`}>
                    {emojis[id - 1]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút điều khiển */}
      <div className="controls">
        {step < questions.length ? (
          <>
            <button className="btn btn-primary" onClick={handleReveal}>
              Mở gương mặt
            </button>
            <button className="btn" onClick={resetGame} title="Chơi lại từ đầu">
              Reset
            </button>
          </>
        ) : (
          <button className="btn" onClick={resetGame}>
            Chơi lại
          </button>
        )}

        <div className="spacer" />

        {/* BGM toggle */}
        <button className="btn" onClick={toggleBgm}>
          {bgmOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
        </button>
      </div>

      {/* Overlay yêu cầu bấm Bắt đầu để kích hoạt âm thanh */}
      {!ready && (
        <div className="start-overlay">
          <div className="start-card">
            <h2>THÂN NÀO ĐẦU NẤY</h2>
            <h2>第一个游戏：对号入头</h2>
            <p>
              Nhấn <b>Bắt đầu</b> để vào game.
            </p>
            <button className="btn btn-primary" onClick={handleStart}>
              Bắt đầu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
