import { useEffect, useRef, useState } from "react";
import "./Game.css";

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

const emojis = ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉"];

export default function Game() {
  const [revealed, setRevealed] = useState([]);
  const [hidden, setHidden] = useState({});
  const [justRevealed, setJustRevealed] = useState([]);
  const [step, setStep] = useState(0);

  // NEW: trạng thái popup “sai”
  const [wrongOpen, setWrongOpen] = useState(false);

  // Audio
  const [ready, setReady] = useState(false);
  const [bgmOn, setBgmOn] = useState(true);
  const bgmRef = useRef(null);
  const correctRef = useRef(null);
  const wrongRef = useRef(null);

  const timersRef = useRef([]);

  const isGameDone = step >= questions.length;
  const currentFaces = !isGameDone ? questions[step].faces : [];
  const remainingFaces = currentFaces.filter((id) => !revealed.includes(id));
  const isCurrentQuestionDone = !isGameDone && remainingFaces.length === 0;

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    revealed.forEach((id) => {
      if (!hidden[id]) {
        const t = setTimeout(() => {
          setHidden((prev) => ({ ...prev, [id]: true }));
        }, 700);
        timersRef.current.push(t);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, hidden]);

  // Đóng popup khi nhấn Escape
  useEffect(() => {
    if (!wrongOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setWrongOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wrongOpen]);

  const handleStart = async () => {
    setReady(true);
    try {
      if (bgmRef.current) {
        bgmRef.current.volume = 0.2;
        await bgmRef.current.play();
      }
    } catch {
      console.log("");
    }
  };

  const toggleBgm = async () => {
    if (!bgmRef.current) return;
    if (bgmOn) {
      bgmRef.current.pause();
      setBgmOn(false);
    } else {
      try {
        await bgmRef.current.play();
        setBgmOn(true);
      } catch {
        console.log("");
      }
    }
  };

  // OPEN ONE FACE
  const openOneFace = (id) => {
    if (isGameDone) return;

    // Nếu click vào mặt KHÔNG thuộc câu hiện tại -> hiện popup báo sai
    if (!currentFaces.includes(id)) {
      setWrongOpen(true);

      try {
        if (wrongRef.current) {
          wrongRef.current.currentTime = 0;
          wrongRef.current.play();
        }
      } catch (e) {
        console.warn("Play wrong blocked:", e);
      }
      return;
    }

    if (revealed.includes(id)) return;

    setRevealed((prev) => [...prev, id]);
    setJustRevealed([id]);

    // âm correct mỗi lần mở đúng
    try {
      if (correctRef.current) {
        correctRef.current.currentTime = 0;
        correctRef.current.play();
      }
    } catch {
      console.log("");
    }

    const t = setTimeout(() => setJustRevealed([]), 1500);
    timersRef.current.push(t);
  };

  const handleRevealRandom = () => {
    if (isGameDone || remainingFaces.length === 0) return;
    const pick =
      remainingFaces[Math.floor(Math.random() * remainingFaces.length)];
    openOneFace(pick);
  };

  const handleNext = () => {
    if (isGameDone || !isCurrentQuestionDone) return;
    setStep((s) => s + 1);
  };

  const resetGame = () => {
    setRevealed([]);
    setHidden({});
    setJustRevealed([]);
    setStep(0);
    setWrongOpen(false);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  return (
    <div className="game-root">
      {/* Audio */}
      <audio ref={bgmRef} src="./audio/bgm_cut.mp3" loop preload="auto" />
      <audio ref={correctRef} src="./audio/correct_cut.mp3" preload="auto" />
      <audio ref={wrongRef} src="./audio/wrong.mp3" />

      {/* Topbar */}
      <div className="millionaire-topbar">
        {!isGameDone ? (
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
        <img src="./group.png" alt="Group" className="group-photo" />
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
                onClick={() => openOneFace(id)}
                role="button"
                aria-label={`Mặt ${id}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openOneFace(id);
                  }
                }}
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

      {/* Controls */}
      <div className="controls">
        {!isGameDone ? (
          <>
            <button className="btn" onClick={handleRevealRandom}>
              Mở 1 gương mặt (ngẫu nhiên)
            </button>

            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!isCurrentQuestionDone}
              title={
                isCurrentQuestionDone
                  ? "Sang câu tiếp theo"
                  : "Hãy mở đủ các gương mặt của câu này trước"
              }
            >
              Tiếp tục
              {!isCurrentQuestionDone && remainingFaces.length > 0
                ? ` (${remainingFaces.length} còn lại)`
                : ""}
            </button>

            <button className="btn" onClick={resetGame} title="Chơi lại từ đầu">
              Reset
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={resetGame}>
            Chơi lại
          </button>
        )}

        <div className="spacer" />

        <button className="btn" onClick={toggleBgm}>
          {bgmOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
        </button>
      </div>

      {/* Start overlay */}
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

      {/* WRONG POPUP */}
      {wrongOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wrong-title-vi"
          onClick={(e) => {
            // click nền đóng popup
            if (e.target === e.currentTarget) setWrongOpen(false);
          }}
        >
          <div className="modal-card">
            <h3 id="wrong-title-vi">Bạn đã trả lời sai</h3>
            <div className="modal-sub zh">你答错了</div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setWrongOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
