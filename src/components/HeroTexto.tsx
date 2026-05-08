'use client';

import { useState, useEffect, useRef } from 'react';

const mensagens = [
  { titulo: 'Compras frescas\ndireto na sua porta',        sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Aqui todos os dias\ntem promoção para você.', sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Seu dinheiro\nrende mais aqui',               sub: 'Promoção diária • Produto selecionado.' },
  { titulo: 'Toda hora uma oferta\nnova pra você.',        sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Seu mercado favorito\na um clique.',          sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Planeje suas compras\ncom quem te valoriza',  sub: 'Menor preço da região • Todo dia tem promoção.' },
  { titulo: 'Inteligência é pagar\nmenos e comer melhor.', sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Economia real,\nproduto de verdade.',         sub: 'O preço mais baixo de toda a região!' },
  { titulo: 'Fazer compra boa\nsem gastar muito existe',   sub: 'E aqui você encontra! Todo dia.' },
];

export default function HeroTexto() {
  const [indice, setIndice] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [translateY, setTranslateY] = useState(0);
  const indiceRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trocar = () => {
      // fade out
      setOpacity(0);
      setTranslateY(10);

      timerRef.current = setTimeout(() => {
        // troca texto
        indiceRef.current = (indiceRef.current + 1) % mensagens.length;
        setIndice(indiceRef.current);

        // fade in
        setOpacity(1);
        setTranslateY(0);

        // agenda próxima troca
        timerRef.current = setTimeout(trocar, 4000);
      }, 450);
    };

    timerRef.current = setTimeout(trocar, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const msg = mensagens[indice];

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        willChange: 'opacity, transform',
      }}
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight line-clamp-3 sm:line-clamp-none">
        {msg.titulo.split('\n').map((linha, i, arr) => (
          <span key={i}>{linha}{i < arr.length - 1 && <br />}</span>
        ))}
      </h1>
      <p className="text-green-200 mb-8 text-base md:text-lg max-w-md">
        {msg.sub}
      </p>
    </div>
  );
}
