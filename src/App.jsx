import { useEffect, useMemo, useRef, useState } from 'react';
import { ASSET_MAP } from './data/assetMap.js';

const WEDDING_DATE = new Date('2026-11-29T13:00:00+07:00');
const RSVP_OPTIONS = ['Hadir', 'Tidak Hadir', 'Belum Bisa Memastikan'];
const RSVP_STORAGE_KEY = 'surya-dian-rsvp';
const GUESTBOOK_STORAGE_KEY = 'surya-dian-guestbook';

function getGuestNameFromQuery() {
  if (typeof window === 'undefined') return 'Tamu Undangan';

  const params = new URLSearchParams(window.location.search);
  const rawName = params.get('to');
  return rawName ? rawName.replace(/-/g, ' ') : 'Tamu Undangan';
}

function formatCountdown(target) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function readLocalStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Local storage unavailable:', error);
  }
}

function AssetImage({ src, alt, className, label, fallbackClass = '' }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className={`asset-fallback ${fallbackClass}`} aria-label={alt || label}>
        {label || 'Asset pending'}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function App() {
  const [guestName, setGuestName] = useState('Tamu Undangan');
  const [coverOpen, setCoverOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [countdown, setCountdown] = useState(formatCountdown(WEDDING_DATE));
  const [selectedStatus, setSelectedStatus] = useState('Hadir');
  const [guestCount, setGuestCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSaved, setRsvpSaved] = useState(false);
  const [guestbookEntries, setGuestbookEntries] = useState([]);
  const [guestbookVisibleCount, setGuestbookVisibleCount] = useState(6);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [musicError, setMusicError] = useState('');
  const [rsvpFormError, setRsvpFormError] = useState('');

  const audioRef = useRef(null);

  const galleryItems = useMemo(
    () => [
      { id: 'IRL_9483', label: 'IRL_9483', text: 'Reflection', type: 'large' },
      { id: 'IRL_1228', label: 'IRL_1228', text: 'Urban newspaper', type: 'small' },
      { id: 'IRL_9722', label: 'IRL_9722', text: 'Chemistry', type: 'small' },
      { id: 'COUPLE_RED', label: 'Couple outfit merah', text: 'Highlight', type: 'large' },
      { id: 'IRL_9285', label: 'IRL_9285', text: 'Walking', type: 'small' },
      { id: 'IRL_9887', label: 'IRL_9887', text: 'Detail close-up', type: 'small' },
      { id: 'COUPLE_GREEN', label: 'Couple under greenery', text: 'Garden moment', type: 'large' },
      { id: 'IRL_9800', label: 'IRL_9800', text: 'Closing frame', type: 'large' },
    ],
    []
  );

  useEffect(() => {
    const name = getGuestNameFromQuery();
    setGuestName(name);

    const interval = setInterval(() => {
      setCountdown(formatCountdown(WEDDING_DATE));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const audio = new Audio(ASSET_MAP.audio.music);
    audio.loop = true;
    audio.volume = 0.32;
    audio.preload = 'none';
    audio.addEventListener('error', () => {
      setMusicError('Audio undangan belum tersedia di perangkat ini.');
    });
    audio.addEventListener('ended', () => {
      if (musicPlaying) {
        audio.play().catch(() => setMusicPlaying(false));
      }
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.remove();
    };
  }, []);

  useEffect(() => {
    fetchGuestbook();
  }, []);

  const fetchGuestbook = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/guestbook`);
      if (!response.ok) throw new Error('Guestbook fetch failed');
      const data = await response.json();
      setGuestbookEntries(data || []);
    } catch (error) {
      const localEntries = readLocalStorage(GUESTBOOK_STORAGE_KEY, []);
      setGuestbookEntries(localEntries || []);
    }
  };

  const handleOpenInvitation = async () => {
    setCoverOpen(true);

    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch (error) {
        setMusicPlaying(false);
        setMusicError('Browser memblokir autoplay. Tekan tombol musik untuk mulai.');
      }
    }
  };

  const handleMusicToggle = async () => {
    const audio = audioRef.current;
    if (!audio) {
      setMusicError('Audio undangan belum tersedia.');
      return;
    }

    try {
      if (musicPlaying) {
        audio.pause();
        setMusicPlaying(false);
      } else {
        await audio.play();
        setMusicPlaying(true);
        setMusicError('');
      }
    } catch (error) {
      setMusicError('Audio tidak dapat diputar pada saat ini.');
    }
  };

  const handleSubmitRsvp = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setRsvpFormError('');

    const payload = {
      name: guestName,
      status: selectedStatus,
      guestCount,
      message: rsvpMessage.trim(),
    };

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('RSVP gagal dikirim');
      }

      setRsvpSaved(true);
      setRsvpMessage('');
      await fetchGuestbook();
    } catch (error) {
      const previous = readLocalStorage(RSVP_STORAGE_KEY, []);
      const record = {
        id: `${Date.now()}`,
        name: guestName,
        status: selectedStatus,
        guestCount,
        message: rsvpMessage.trim(),
        updatedAt: new Date().toISOString(),
      };
      const next = [...previous, record];
      writeLocalStorage(RSVP_STORAGE_KEY, next);

      const guestbook = readLocalStorage(GUESTBOOK_STORAGE_KEY, []);
      if (rsvpMessage.trim()) {
        const messageEntry = {
          id: `${Date.now()}-message`,
          name: guestName,
          message: rsvpMessage.trim(),
          createdAt: new Date().toISOString(),
        };
        writeLocalStorage(GUESTBOOK_STORAGE_KEY, [...guestbook, messageEntry]);
      }

      setGuestbookEntries(readLocalStorage(GUESTBOOK_STORAGE_KEY, []));
      setRsvpSaved(true);
      setRsvpMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = async (accountNumber) => {
    try {
      await navigator.clipboard.writeText(accountNumber.replace(/\s+/g, ''));
      setCopyState('✓ Berhasil disalin');
      setTimeout(() => setCopyState(''), 1800);
    } catch (error) {
      setCopyState('Salin manual');
    }
  };

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const currentGuestbook = guestbookEntries.slice(0, guestbookVisibleCount);

  return (
    <>
      <div className={`cover-shell ${coverOpen ? 'cover-closed' : ''}`}>
        <div className="cover-background" aria-hidden="true" />
        <div className="cover-content">
          <p className="eyebrow">The Wedding of</p>
          <h1>Surya &amp; Dian</h1>
          <div className="date-line">29 · 11 · 2026</div>
          <div className="invite-target">Kepada Yth.<br />{toTitleCase(guestName)}</div>
          <button className="primary-button open-button" onClick={handleOpenInvitation}>
            Buka Undangan
          </button>
        </div>
      </div>

      <div className={`page-shell ${coverOpen ? 'page-visible' : ''}`}>
        <button
          className={`floating-music ${musicPlaying ? 'playing' : ''}`}
          onClick={handleMusicToggle}
          aria-label={musicPlaying ? 'Pause musik' : 'Putar musik'}
          type="button"
        >
          {musicPlaying ? '❚❚' : '♫'}
        </button>

        <nav className="floating-nav" aria-label="Navigasi undangan">
          <a href="#home">Beranda</a>
          <a href="#event">Acara</a>
          <a href="#location">Lokasi</a>
          <a href="#story">Cerita</a>
          <a href="#gallery">Galeri</a>
          <a href="#rsvp">RSVP</a>
          <a href="#gift">Hadiah</a>
        </nav>

        <header id="home" className="hero-section">
          <div className="hero-visual">
            <AssetImage
              src={ASSET_MAP.hero}
              alt="Surya dan Dian"
              className="hero-image"
              label="IRL_9695"
              fallbackClass="hero-fallback"
            />
            <div className="hero-overlay" />
          </div>
          <div className="hero-copy">
            <h2>Surya &amp; Dian</h2>
            <p>29 November 2026</p>
          </div>
        </header>

        <main>
          <section className="section intro">
            <div className="container narrow text-center">
              <p>
                Dengan penuh rasa syukur, setelah perjalanan yang telah kami lalui bersama,
                kini kami akan memulai langkah baru sebagai suami dan istri.
              </p>
              <p>
                Kami berharap dapat berbagi kebahagiaan di hari istimewa ini bersama
                keluarga, sahabat, dan orang-orang yang berarti dalam perjalanan kami.
              </p>
            </div>
          </section>

          <section className="section profiles">
            <div className="profile-block groom">
              <div className="profile-photo-block">
                <AssetImage
                  src={ASSET_MAP.groom}
                  alt="Surya Gali Martua Hutabarat"
                  className="profile-photo"
                  label="Surya"
                  fallbackClass="profile-fallback"
                />
              </div>
              <div className="profile-copy">
                <p className="section-tag">THE GROOM</p>
                <h3>Surya Gali Martua Hutabarat</h3>
                <p>
                  Putra dari<br />
                  Bapak Sony Leopatra Hutabarat<br />
                  &amp;<br />
                  Ibu Mukronah
                </p>
              </div>
            </div>

            <div className="profile-block bride">
              <div className="profile-photo-block">
                <AssetImage
                  src={ASSET_MAP.bride}
                  alt="Dian Rahmawati Wibisono"
                  className="profile-photo"
                  label="Dian"
                  fallbackClass="profile-fallback"
                />
              </div>
              <div className="profile-copy">
                <p className="section-tag">THE BRIDE</p>
                <h3>Dian Rahmawati Wibisono</h3>
                <p>
                  Putri dari<br />
                  Bapak Rudy Setiawan<br />
                  &amp;<br />
                  Ibu Lisrofi Yanti
                </p>
              </div>
            </div>
          </section>

          <section id="event" className="section save-date">
            <div className="container narrow">
              <p className="section-tag centered">SAVE THE DATE</p>
              <div className="date-showcase">
                <span className="day-label">Minggu</span>
                <span className="date-number">29</span>
                <span className="month-label">November 2026</span>
              </div>

              <div className="countdown-grid" aria-label="Countdown acara">
                <div className="countdown-item">
                  <strong>{countdown.days}</strong>
                  <span>Hari</span>
                </div>
                <div className="countdown-item">
                  <strong>{countdown.hours}</strong>
                  <span>Jam</span>
                </div>
                <div className="countdown-item">
                  <strong>{countdown.minutes}</strong>
                  <span>Menit</span>
                </div>
                <div className="countdown-item">
                  <strong>{countdown.seconds}</strong>
                  <span>Detik</span>
                </div>
              </div>

              <div className="event-detail">
                <div className="event-line">
                  <span className="event-label">Kehadiran Tamu</span>
                  <span className="event-value">13.00 WIB</span>
                </div>
                <div className="event-line">
                  <span className="event-label">Akad Nikah</span>
                  <span className="event-value">15.00 WIB</span>
                </div>
                <div className="event-line">
                  <span className="event-label">Ramah Tamah</span>
                  <span className="event-value">Setelah akad</span>
                </div>
              </div>

              <div className="venue-block">
                <p>Villa Ardila Puncak</p>
                <p>Cisarua, Kabupaten Bogor, Jawa Barat</p>
              </div>

              <p className="notice">
                Kami akan sangat berbahagia menyambut kehadiran Anda sebelum prosesi akad
                dimulai.
              </p>

              <div className="calendar-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    window.open(
                      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Surya%20%26%20Dian%20Wedding&dates=20261129T060000Z/20261129T100000Z&details=Wedding%20of%20Surya%20%26%20Dian%20at%20Villa%20Ardila%20Puncak%2C%20Cisarua%2C%20Bogor.&location=Villa%20Ardila%20Puncak%2C%20Jl.%20Raya%20Puncak%2C%20Batu%20Layang%2C%20Cisarua%2C%20Kabupaten%20Bogor%2C%20Jawa%20Barat%2016750&sf=true&output=xml',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  Tambahkan ke Kalender
                </button>
              </div>
            </div>
          </section>

          <section id="location" className="section location">
            <div className="container narrow location-box">
              <p className="section-tag centered">Wedding Venue</p>
              <h3>Villa Ardila Puncak</h3>
              <p>
                Jl. Raya Puncak, Batu Layang<br />
                Kec. Cisarua, Kabupaten Bogor<br />
                Jawa Barat 16750
              </p>
              <a
                className="primary-button"
                href="https://maps.app.goo.gl/m1vQcs2FSJbfQwYd8?g_st=aw"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka Google Maps
              </a>
            </div>
          </section>

          <section id="story" className="section story">
            <div className="container">
              <p className="section-tag centered">OUR STORY</p>

              <div className="story-list">
                <article className="story-card">
                  <div className="story-topline">2019 — Awal Pertemuan</div>
                  <p>
                    Cerita kami bermula di tahun 2019, ketika dipertemukan sebagai rekan kerja
                    di Indomaret. Di hari pertama Surya datang ke tempat penempatan kerja, Dian
                    menjadi orang pertama yang menyapa.
                  </p>
                  <p>
                    Saat itu, kami hanyalah dua rekan kerja yang menjalani keseharian seperti
                    biasa. Namun seiring waktu, tanpa disadari masing-masing mulai memiliki
                    kesan tersendiri.
                  </p>
                  <p>
                    Bagi Dian, Surya menarik perhatian lewat caranya membawa diri dan
                    penampilannya yang selalu rapi saat bekerja.
                  </p>
                  <p>
                    Sementara bagi Surya, Dian punya cara berbicara yang tertata dan selalu tahu
                    bagaimana menyampaikan sesuatu dengan baik. Ia sederhana, apa adanya, dan
                    tidak neko-neko. Walaupun terkadang cukup bawel, justru itulah salah satu
                    hal yang membuat Dian begitu khas di mata Surya.
                  </p>
                </article>

                <div className="story-visual">
                  <AssetImage
                    src={ASSET_MAP.storyOne}
                    alt="Kisah Surya dan Dian"
                    className="story-photo"
                    label="Story 2019"
                    fallbackClass="story-fallback"
                  />
                </div>

                <article className="story-card">
                  <div className="story-topline">2021 — Ketika Semuanya Mulai Berubah</div>
                  <p>
                    Ketika Dian memutuskan berhenti bekerja untuk melanjutkan kuliah, ternyata
                    ada sedikit rasa kehilangan bagi Surya. Suasana kerja terasa berbeda karena
                    seseorang yang biasanya ditemui hampir setiap hari sudah tidak ada lagi.
                  </p>
                  <p>
                    Beberapa waktu kemudian, kami kembali bertemu saat berkumpul dan makan
                    bersama teman-teman lama. Setelah acara selesai, Surya mengantar Dian pulang.
                  </p>
                  <p>
                    Sejak malam itu, komunikasi kami mulai berubah. Obrolan yang sebelumnya hanya
                    sebatas teman kerja berlanjut menjadi percakapan yang semakin sering.
                  </p>
                </article>

                <article className="story-card highlight">
                  <div className="story-topline">09 April 2021 — Our Beginning</div>
                  <p>
                    Setelah semakin dekat, Surya akhirnya memberanikan diri mengajak Dian pergi.
                    Dian mengira hari itu hanya akan menjadi pertemuan biasa, tanpa tahu bahwa
                    Surya sudah menyiapkan sebuah kejutan.
                  </p>
                  <p>
                    Diam-diam, Surya mengajak teman-teman lama yang dulu menjadi bagian dari
                    keseharian kami saat bekerja untuk ikut berkumpul.
                  </p>
                  <p>
                    Di hadapan mereka, Surya menyampaikan perasaannya dan meminta Dian untuk
                    menjadi bagian yang lebih istimewa dalam hidupnya.
                  </p>
                  <p>
                    Dan ternyata, Dian menjawab iya. Sampai hari ini, Surya masih suka bercanda
                    bahwa mungkin Dian menerimanya karena saat itu terlalu banyak pasang mata yang
                    melihat—jadi sedikit sulit untuk bilang tidak. 😄
                  </p>
                </article>

                <div className="story-visual larger">
                  <AssetImage
                    src={ASSET_MAP.storyTwo}
                    alt="Momen awal hubungan"
                    className="story-photo"
                    label="Story beginning"
                    fallbackClass="story-fallback"
                  />
                </div>

                <article className="story-card">
                  <div className="story-topline">2021–2026 — Bertumbuh Bersama</div>
                  <p>
                    Sejak hari itu, perjalanan kami mulai dipenuhi banyak cerita. Kami masih
                    ingat perjalanan pertama kami ke pantai. Awalnya hanya pergi bersama dan
                    menikmati waktu berdua, tapi ternyata sesederhana itu bisa terasa begitu
                    menyenangkan.
                  </p>
                  <p>
                    Dian juga mengenalkan Surya pada banyak hal baru, terutama soal makanan.
                    Sebelum bersama Dian, Surya bukan orang yang banyak tahu soal makanan. Tapi
                    sejak ada Dian, mencoba makanan dan tempat-tempat baru justru menjadi bagian
                    kecil yang selalu menyenangkan dari perjalanan kami. 😄
                  </p>
                </article>

                <article className="story-card">
                  <div className="story-topline">Menuju Selamanya</div>
                  <p>
                    Kalau ditanya kapan tepatnya Surya mulai yakin ingin menikah dengan Dian,
                    mungkin Surya sendiri nggak punya satu tanggal atau satu momen khusus untuk
                    menjawabnya.
                  </p>
                  <p>
                    Rasa yakin itu datang pelan-pelan. Setelah bertahun-tahun bersama dan
                    melewati banyak hal, Dian sudah menjadi bagian yang begitu dekat dalam
                    kehidupan Surya.
                  </p>
                  <p>
                    Bukan karena hubungan kami selalu sempurna, dan bukan juga karena kami selalu
                    sepakat dalam segala hal. Tapi setelah semua yang sudah dijalani bersama,
                    Surya mulai sadar satu hal: kalau suatu hari harus membangun kehidupan bersama
                    seseorang, Surya ingin orang itu adalah Dian.
                  </p>
                </article>

                <article className="story-card ending">
                  <div className="story-topline">29 November 2026 — A New Chapter</div>
                  <p>
                    Tujuh tahun sejak pertemuan pertama kami, dan lebih dari lima tahun sejak
                    memutuskan untuk berjalan sebagai pasangan, kini kami sampai pada babak yang
                    baru.
                  </p>
                  <p>
                    Pada 29 November 2026, di hadapan keluarga dan orang-orang yang kami sayangi,
                    kami akan mengikat janji untuk menjalani kehidupan sebagai suami dan istri.
                  </p>
                  <p>
                    Cerita kami tidak bermula dari sesuatu yang luar biasa. Ia dimulai dari sebuah
                    sapaan sederhana di tempat kerja pada tahun 2019. Sebuah sapaan yang saat itu
                    mungkin terasa biasa saja, tetapi ternyata menjadi awal dari perjalanan yang
                    membawa kami sampai ke hari ini.
                  </p>
                  <p className="signature-line">Surya &amp; Dian</p>
                  <p className="signature-line italic">From a simple hello, to a lifetime together.</p>
                </article>
              </div>
            </div>
          </section>

          <section id="gallery" className="section gallery-section">
            <div className="container">
              <p className="section-tag centered">GALLERY</p>
              <div className="gallery-grid">
                {galleryItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`gallery-item ${item.type}`}
                    onClick={() => handleOpenLightbox(index)}
                    aria-label={`Lihat ${item.label}`}
                  >
                    <AssetImage
                      src={ASSET_MAP.gallery[item.id]}
                      alt={item.text}
                      className="gallery-image"
                      label={item.label}
                      fallbackClass="gallery-fallback"
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="section film-section">
            <div className="container narrow">
              <p className="section-tag centered">WEDDING FILM</p>
              <h3>A Glimpse of Our Story</h3>
              <div className="film-player">
                <div className="film-poster">
                  <AssetImage
                    src={ASSET_MAP.video.poster}
                    alt="Poster film wedding"
                    className="film-poster-image"
                    label="TEASER"
                    fallbackClass="film-fallback"
                  />
                  <button
                    type="button"
                    className="play-video"
                    onClick={() => {
                      const video = document.getElementById('wedding-film');
                      if (video) {
                        video.play();
                        const audio = audioRef.current;
                        if (audio && !audio.paused) {
                          audio.pause();
                          setMusicPlaying(false);
                        }
                      }
                    }}
                  >
                    ▶ Play Film
                  </button>
                </div>
                <video id="wedding-film" controls preload="none" playsInline>
                  <source src={ASSET_MAP.video.teaser} type="video/mp4" />
                  Browser Anda tidak mendukung tag video.
                </video>
              </div>
            </div>
          </section>

          <section id="rsvp" className="section rsvp-section">
            <div className="container narrow card-box">
              <p className="section-tag centered">RSVP</p>
              <h3>Konfirmasi Kehadiran</h3>

              <form onSubmit={handleSubmitRsvp} className="rsvp-form">
                <label>
                  Nama Tamu
                  <input type="text" value={guestName} readOnly />
                </label>

                <div className="radio-row">
                  {RSVP_OPTIONS.map((option) => (
                    <label key={option} className="option-pill">
                      <input
                        type="radio"
                        name="attendance"
                        value={option}
                        checked={selectedStatus === option}
                        onChange={() => setSelectedStatus(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {selectedStatus === 'Hadir' && (
                  <label>
                    Jumlah Tamu
                    <select value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))}>
                      {Array.from({ length: 5 }, (_, index) => index + 1).map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Ucapan &amp; Doa (opsional)
                  <textarea
                    rows="4"
                    value={rsvpMessage}
                    onChange={(event) => setRsvpMessage(event.target.value)}
                    placeholder="Tulis doa atau ucapan terbaik Anda..."
                  />
                </label>

                {rsvpFormError && <p className="form-error">{rsvpFormError}</p>}

                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : 'Kirim RSVP'}
                </button>
              </form>

              {rsvpSaved && (
                <div className="thanks-box">
                  <h4>Terima kasih 🤍</h4>
                  <p>Konfirmasi kehadiran Anda telah kami terima.</p>
                </div>
              )}
            </div>

            <div className="container guestbook-box">
              <p className="section-tag centered">Ucapan &amp; Doa</p>
              {currentGuestbook.length ? (
                <div className="guestbook-list">
                  {currentGuestbook.map((item) => (
                    <article key={item.id} className="guestbook-item">
                      <strong>{item.name}</strong>
                      <p>{item.message}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="guestbook-empty">Belum ada ucapan. Jadilah yang pertama menulis doa.</p>
              )}

              {guestbookEntries.length > guestbookVisibleCount && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setGuestbookVisibleCount((count) => count + 4)}
                >
                  Lihat Ucapan Lainnya
                </button>
              )}
            </div>
          </section>

          <section id="gift" className="section gift-section">
            <div className="container narrow card-box">
              <p className="section-tag centered">WEDDING GIFT</p>
              <h3>Tanda Kasih</h3>
              <p>
                Kehadiran dan doa Anda merupakan hadiah yang berarti bagi kami. Namun, apabila
                ingin memberikan tanda kasih, dapat melalui pilihan berikut.
              </p>

              <div className="gift-panel">
                <div className="account-card">
                  <p className="bank-name">BCA</p>
                  <h4>Surya Gali Martua Hutabarat</h4>
                  <p className="account-number">6240898045</p>
                  <button type="button" className="copy-button" onClick={() => handleCopyAccount('6240898045')}>
                    {copyState === '✓ Berhasil disalin' ? '✓ Berhasil disalin' : 'Salin Nomor Rekening'}
                  </button>
                </div>

                <div className="account-card">
                  <p className="bank-name">BCA</p>
                  <h4>Dian Rahmawati Wibisono</h4>
                  <p className="account-number">6330970888</p>
                  <button type="button" className="copy-button" onClick={() => handleCopyAccount('6330970888')}>
                    {copyState === '✓ Berhasil disalin' ? '✓ Berhasil disalin' : 'Salin Nomor Rekening'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="closing-hero">
            <div className="closing-overlay" />
            <div className="closing-copy">
              <p>Terima kasih telah menjadi bagian dari perjalanan dan kebahagiaan kami.</p>
              <p>
                Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i dapat hadir
                dan berbagi momen istimewa ini bersama kami.
              </p>
              <p>Sampai bertemu di hari bahagia kami. 🤍</p>
              <h4>Surya &amp; Dian</h4>
              <p>29 · 11 · 2026</p>
            </div>
          </section>
        </main>
      </div>

      {showLightbox && (
        <div className="lightbox" onClick={() => setShowLightbox(false)}>
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setShowLightbox(false)}
            aria-label="Tutup galeri"
          >
            ×
          </button>
          <div className="lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <AssetImage
              src={ASSET_MAP.gallery[galleryItems[lightboxIndex].id]}
              alt={galleryItems[lightboxIndex].text}
              className="lightbox-image"
              label={galleryItems[lightboxIndex].label}
              fallbackClass="gallery-fallback"
            />
            <div className="lightbox-caption">{galleryItems[lightboxIndex].label}</div>
          </div>
        </div>
      )}

      {musicError && <div className="music-status">{musicError}</div>}
    </>
  );
}

export default App;
