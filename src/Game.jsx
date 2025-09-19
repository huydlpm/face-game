import { useEffect, useMemo, useRef, useState } from "react";
import "./Game.css";

// ===== DỮ LIỆU =====
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

// ===== Asset trong src/assets =====
import bgmUrl from "./assets/audio/bgm_cut.mp3";
import correctUrl from "./assets/audio/correct_cut.mp3";
import wrongUrl from "./assets/audio/wrong.mp3";
import groupImg from "./assets/images/group.png";

export default function Game() {
  // Trạng thái game
  const [revealed, setRevealed] = useState(() => new Set());
  const [hidden, setHidden] = useState({});
  const [justRevealed, setJustRevealed] = useState([]);
  const [step, setStep] = useState(0);

  // Popup “sai”
  const [wrongOpen, setWrongOpen] = useState(false);

  // Audio
  const [ready, setReady] = useState(false);
  const [bgmOn, setBgmOn] = useState(true);
  const bgmRef = useRef(null);
  const correctRef = useRef(null);
  const wrongRef = useRef(null);

  // Helper & timers
  const timersRef = useRef([]);

  const isGameDone = step >= questions.length;
  const currentFaces = useMemo(
    () => (!isGameDone ? questions[step].faces : []),
    [isGameDone, step]
  );
  const remainingFaces = useMemo(
    () => currentFaces.filter((id) => !revealed.has(id)),
    [currentFaces, revealed]
  );
  const isCurrentQuestionDone = !isGameDone && remainingFaces.length === 0;

  // Ẩn mask sau khi reveal (fade-out)
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

  // Đóng popup khi Escape + trap focus trong modal
  useEffect(() => {
    if (!wrongOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") setWrongOpen(false);
      if (e.key === "Tab") {
        const focusables = Array.from(
          document.querySelectorAll(
            '.modal-card button, .modal-card [tabindex="0"], .modal-card a[href]'
          )
        );
        if (focusables.length === 0) return;
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey
          ? (idx - 1 + focusables.length) % focusables.length
          : (idx + 1) % focusables.length;
        focusables[next].focus();
      }
    };

    document.querySelector(".modal-card .btn")?.focus();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wrongOpen]);

  // Cleanup khi UNMOUNT
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      [bgmRef, correctRef, wrongRef].forEach((r) => {
        if (r.current) {
          r.current.pause();
          r.current.currentTime = 0;
        }
      });
    };
  }, []);

  // Pause nhạc khi tab ẩn, play lại khi hiện (nếu bgmOn)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) bgmRef.current?.pause();
      else if (bgmOn) bgmRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [bgmOn]);

  // Điều khiển
  const handleStart = async () => {
    setReady(true);
    try {
      if (bgmRef.current) {
        bgmRef.current.volume = 0.2; // cố định, không có slider
        if (bgmOn) await bgmRef.current.play();
      }
    } catch {
      //
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
        //
      }
    }
  };

  const openOneFace = (id) => {
    if (isGameDone) return;
    if (!currentFaces.includes(id)) {
      setWrongOpen(true);
      try {
        if (wrongRef.current) {
          wrongRef.current.currentTime = 0;
          wrongRef.current.play();
        }
      } catch {
        //
      }
      return;
    }
    if (revealed.has(id)) return;

    setRevealed((prev) => new Set(prev).add(id));
    setJustRevealed([id]);

    try {
      if (correctRef.current) {
        correctRef.current.currentTime = 0;
        correctRef.current.play();
      }
    } catch {
      //
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
    setRevealed(new Set());
    setHidden({});
    setJustRevealed([]);
    setStep(0);
    setWrongOpen(false);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const currentQ = !isGameDone ? questions[step] : null;

  return (
    <div className="game-root">
      {/* Audio */}
      <audio ref={bgmRef} src={bgmUrl} loop preload="auto" />
      <audio ref={correctRef} src={correctUrl} preload="auto" />
      <audio ref={wrongRef} src={wrongUrl} />

      {/* Ẩn nền khỏi SR khi popup mở */}
      <div className="app-content" aria-hidden={wrongOpen ? "true" : "false"}>
        {/* Topbar */}
        <div className="millionaire-topbar">
          {!isGameDone ? (
            <div
              className="question-pill"
              role="region"
              aria-label="Câu hỏi hiện tại"
            >
              <div className="question-number">CÂU {currentQ.id}</div>
              <div className="question-lines" aria-live="polite">
                <div className="q-vi">{currentQ.vi}</div>
                <div className="q-zh">{currentQ.zh}</div>
              </div>
            </div>
          ) : (
            <div className="question-pill done">🎉 Hoàn thành trò chơi!</div>
          )}
        </div>

        {/* Ảnh + overlay */}
        <div className="photo-wrapper">
          <img
            src={groupImg}
            alt=""
            role="img"
            aria-label="Ảnh nhóm với 9 vị trí gương mặt"
            className="group-photo"
            draggable="false"
          />
          <div className="overlay">
            {positions.map(({ id, left, top }) => {
              const isRevealed = revealed.has(id);
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
                aria-disabled={!isCurrentQuestionDone}
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

              <button
                className="btn"
                onClick={resetGame}
                title="Chơi lại từ đầu"
              >
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
          <div className="start-overlay" role="dialog" aria-modal="true">
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

      {/* WRONG POPUP */}
      {wrongOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wrong-title-vi"
          onClick={(e) => {
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
