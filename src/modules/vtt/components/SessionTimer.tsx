import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export const SessionTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-2 bg-bg-secondary/90 backdrop-blur border border-border-default shadow-card flex items-center gap-2 select-none">
      <Timer className="w-3.5 h-3.5 text-accent" />
      <span className="font-mono text-xs font-bold text-text-primary">
        {formatTime(seconds)}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsRunning(!isRunning)}
        className="p-1 h-6 w-6"
        title={isRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
      >
        {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-status-success" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setIsRunning(false);
          setSeconds(0);
        }}
        className="p-1 h-6 w-6 text-text-muted hover:text-status-danger"
        title="Zerar Cronômetro"
      >
        <RotateCcw className="w-3 h-3" />
      </Button>
    </Card>
  );
};
