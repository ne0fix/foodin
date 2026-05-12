'use client';

import { useState, useEffect, useRef } from 'react';

const mensagens = [
  { titulo: 'Sua comida favorita\nna sua porta',            sub: 'Delivery rápido e sem complicação!' },
  { titulo: 'Peça agora e receba\nem minutos',              sub: 'Os melhores pratos, onde você estiver.' },
  { titulo: 'Pratos frescos\nfeitos com carinho',           sub: 'Qualidade garantida em cada entrega.' },
  { titulo: 'Fome? A gente\nresolve pra você.',             sub: 'Peça agora • Pague com PIX ou cartão.' },
  { titulo: 'O sabor de sempre\na um clique.',              sub: 'Variedade de pratos para todos os gostos.' },
  { titulo: 'Entrega rápida\npra matar a fome já.',         sub: 'Sem sair de casa, sem perder tempo.' },
  { titulo: 'Seu restaurante\nfavorito aqui.',              sub: 'Escolha, peça e aguarde — simples assim.' },
  { titulo: 'De hambúrguer\na japonesa — temos tudo.',      sub: 'O cardápio mais completo da cidade.' },
  { titulo: 'Comer bem é\ndireito seu.',                    sub: 'E nós entregamos isso na sua porta.' },
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
