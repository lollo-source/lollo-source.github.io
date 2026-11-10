// Edit this file to update your introduction, name, titles, or project order.
// previewVideo is an optional version with MP3 audio for embedded browsers.
// All asset paths are relative so the site also works at /repository-name/.
export const portfolio = {
  name: "Lorenzo Bianco",
  role: "Sound Design Portfolio",
  introduction: {
    displayTitle: "About me",
    paragraphs: [
      "I'm a Music and Acoustic Engineering graduate from Politecnico di Milano, with a background in Computer Engineering.",
      "I've been producing music since 2023. My interests combine creativity and technology, with a focus on sound design, music production, and audio processing.",
      "This portfolio showcases a selection of my creative work, ranging from advertising and audiovisual sound redesigns to music compositions.",
    ],
  },
  projects: [
    {
      id: "tic-tac-minions",
      displayTitle: "MINIONS",
      title: "Tic Tac × Minions",
      context: "Commercial",
      video: "./assets/media/tic-tac-minions-sound-redesign.mp4",
      previewVideo: "./assets/media/tic-tac-minions-preview.mp4",
      poster: "./assets/posters/tic-tac-minions.jpg",
      width: 848,
      height: 464,
    },
    {
      id: "fate-heavens-feel",
      displayTitle: "FATE",
      title: "Fate Heaven’s Feel II",
      context: "Saber Alter vs. Berserker",
      video: "./assets/media/fate-heavens-feel-sound-redesign.mp4",
      previewVideo: "./assets/media/fate-heavens-feel-preview.mp4",
      poster: "./assets/posters/fate-heavens-feel.jpg",
      width: 464,
      height: 848,
    },
    {
      id: "jujutsu-kaisen",
      displayTitle: "JUJUTSU",
      title: "Jujutsu Kaisen",
      context: "Gojo vs. Hanami",
      video: "./assets/media/jujutsu-kaisen-sound-redesign.mp4",
      previewVideo: "./assets/media/jujutsu-kaisen-preview.mp4",
      poster: "./assets/posters/jujutsu-kaisen.jpg",
      width: 464,
      height: 848,
    },
  ],
  productions: {
    title: "Productions",
    description: "My officially released music productions, available on Spotify.",
    // Change this URL to update the destination. Leave it empty to show a pending state.
    spotifyUrl: "https://open.spotify.com/playlist/6AzndIhGJKeiRuPlEMqA8P?si=MP-ryZhqSBeYp4M3VoXXGQ",
  },
};
