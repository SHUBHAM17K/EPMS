import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [isHoveredLogo, setIsHoveredLogo] = useState(false);
  const [introStep, setIntroStep] = useState(0); // 0: Intro text animation, 1: Main login portal
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('admin@epms.com');
      setPassword('admin123');
    } else if (role === 'MANAGER') {
      setEmail('manager@epms.com');
      setPassword('manager123');
    } else {
      setEmail('employee@epms.com');
      setPassword('employee123');
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Intro animation sequence timer
  useEffect(() => {
    // Play intro for 3 seconds then show login portal
    const timer1 = setTimeout(() => setIntroStep(1), 3200);
    return () => clearTimeout(timer1);
  }, []);

  // High performance Interactive Plexus Constellation Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const particles = [];
    const particleCount = 75;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = Math.random() * 1.2 - 0.6;
        this.vy = Math.random() * 1.2 - 0.6;
        this.radius = Math.random() * 2.5 + 1.5;
      }
      update() {
        // Interactivity with mouse (attraction)
        if (mouseRef.current.x !== null) {
          const dx = mouseRef.current.x - this.x;
          const dy = mouseRef.current.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouseRef.current.radius) {
            const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
            this.x += (dx / distance) * force * 1.5;
            this.y += (dy / distance) * force * 1.5;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = selectedRole === 'ADMIN' ? 'rgba(225, 29, 72, 0.4)' : selectedRole === 'MANAGER' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(29, 78, 216, 0.4)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw lines connecting close particles (Plexus/Constellation effect)
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (110 - distance) / 110 * 0.15;
            
            ctx.strokeStyle = selectedRole === 'ADMIN' 
              ? `rgba(225, 29, 72, ${alpha})` 
              : selectedRole === 'MANAGER' 
              ? `rgba(217, 119, 6, ${alpha})` 
              : `rgba(29, 78, 216, ${alpha})`;
              
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    const result = await login(email, password);
    setSubmitting(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  const getThemeColor = () => {
    if (selectedRole === 'ADMIN') return '#e11d48'; // Crimson
    if (selectedRole === 'MANAGER') return '#d97706'; // Amber
    return '#1d4ed8'; // Cobalt Blue
  };

  return (
    <div className="login-wrapper" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
      {/* Dynamic Background Glow Rings */}
      <div className="login-bg-shape shape-1" style={{ opacity: 0.1, mixBlendMode: 'screen', filter: 'blur(100px)', background: `radial-gradient(circle, ${getThemeColor()} 0%, transparent 70%)` }}></div>
      <div className="login-bg-shape shape-2" style={{ opacity: 0.08, mixBlendMode: 'screen', filter: 'blur(120px)', background: `radial-gradient(circle, ${getThemeColor()} 0%, transparent 70%)` }}></div>

      {introStep === 0 ? (
        /* INTRO ANIMATION: UPES Portal Inspired futuristic loading screen */
        <div style={{
          textAlign: 'center',
          zIndex: 10,
          animation: 'fadeIn 0.5s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Logo outline draw animation */}
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" className="logo-svg">
              <polygon 
                points="50,10 90,80 10,80" 
                fill="none" 
                stroke={getThemeColor()} 
                strokeWidth="4" 
                strokeDasharray="300"
                strokeDashoffset="300"
                style={{
                  animation: 'drawStroke 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}
              />
              <circle 
                cx="50" 
                cy="52" 
                r="12" 
                fill="none"
                stroke={getThemeColor()}
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset="100"
                style={{
                  animation: 'drawStroke 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: `0 0 15px 5px ${getThemeColor()}`,
              animation: 'pulseGlow 1.5s infinite alternate'
            }}></div>
          </div>

          {/* Lettering reveal with expanding spacing */}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '0.4em',
            margin: 0,
            textTransform: 'uppercase',
            animation: 'letterReveal 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            textShadow: `0 0 20px rgba(255,255,255,0.2), 0 0 40px ${getThemeColor()}80`
          }}>
            AXIORA
          </h1>
          
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#64748b',
            letterSpacing: '0.8em',
            marginTop: '0.75rem',
            textTransform: 'uppercase',
            opacity: 0,
            animation: 'fadeInUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards'
          }}>
            TECHNOLOGIES
          </h3>

          <div style={{
            width: '120px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${getThemeColor()}, transparent)`,
            marginTop: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
              animation: 'scanBar 1.5s infinite linear'
            }}></div>
          </div>
        </div>
      ) : (
        /* MAIN LOGIN PORTAL CARD: Glassmorphic Fade In */
        <div 
          className="login-card" 
          style={{ 
            zIndex: 1, 
            borderTop: `4px solid ${getThemeColor()}`, 
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            transition: 'border-color 0.4s ease',
            animation: 'cardSlideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            maxWidth: '430px',
            width: '100%',
            padding: '2.5rem 2rem',
            borderRadius: '16px'
          }}
        >
          {/* Logo container inside Card */}
          <div 
            onMouseEnter={() => setIsHoveredLogo(true)}
            onMouseLeave={() => setIsHoveredLogo(false)}
            style={{ 
              textAlign: 'center', 
              marginBottom: '2rem', 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              background: isHoveredLogo ? 'rgba(255,255,255,0.02)' : 'transparent'
            }}
          >
            <svg 
              width="45" 
              height="45" 
              viewBox="0 0 100 100" 
              style={{ 
                margin: '0 auto 0.5rem', 
                display: 'block',
                transform: isHoveredLogo ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <polygon 
                points="50,15 90,85 10,85" 
                fill="none" 
                stroke={getThemeColor()} 
                strokeWidth="6" 
                strokeLinejoin="round"
                style={{ transition: 'stroke 0.4s ease' }}
              />
              <circle 
                cx="50" 
                cy="55" 
                r="15" 
                fill={getThemeColor()}
                style={{ 
                  transition: 'all 0.4s ease',
                  opacity: isHoveredLogo ? 0.8 : 1,
                  transform: isHoveredLogo ? 'translateY(-3px)' : 'translateY(0)'
                }}
              />
            </svg>

            <h2 style={{ 
              fontSize: '1.35rem', 
              fontWeight: 850, 
              color: '#ffffff', 
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: '0.5rem 0 0 0',
              transition: 'color 0.3s ease',
              color: isHoveredLogo ? getThemeColor() : '#ffffff'
            }}>
              AXIORA TECHNOLOGIES
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.25rem', margin: 0 }}>
              Performance Management Suite
            </p>
          </div>

          {/* Role selector panel */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '0.35rem', borderRadius: '8px', marginBottom: '1.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            {['EMPLOYEE', 'MANAGER', 'ADMIN'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: selectedRole === role ? getThemeColor() : 'transparent',
                  color: selectedRole === role ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: selectedRole === role ? `0 2px 8px ${getThemeColor()}40` : 'none'
                }}
              >
                {role}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              color: '#f87171', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.8rem', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              animation: 'fadeIn 0.3s ease'
            }}>
              System Exception: {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Corporate Identity Email
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@axiora.com"
                style={{ 
                  padding: '0.75rem 1rem', 
                  backgroundColor: 'rgba(15, 23, 42, 0.4)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#ffffff',
                  borderRadius: '8px',
                  width: '100%',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Security Cipher Code
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  padding: '0.75rem 2.5rem 0.75rem 1rem', 
                  backgroundColor: 'rgba(15, 23, 42, 0.4)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#ffffff',
                  borderRadius: '8px',
                  width: '100%',
                  outline: 'none'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  bottom: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#64748b'
                }}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <button 
              type="submit" 
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '0.75rem 0', 
                fontWeight: 700, 
                backgroundColor: getThemeColor(), 
                color: '#ffffff',
                boxShadow: `0 4px 20px ${getThemeColor()}30`,
                transition: 'all 0.3s ease',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating Security Matrix...' : 'REQUEST PORTAL ACCESS'}
            </button>
          </form>

          {/* Seed Accounts Helper */}
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
            <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Authorized Portal Credentials:
            </p>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ADMIN:</span> <span style={{ fontWeight: 600, color: '#ffffff' }}>admin@epms.com / admin123</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MANAGER:</span> <span style={{ fontWeight: 600, color: '#ffffff' }}>manager@epms.com / manager123</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>EMPLOYEE:</span> <span style={{ fontWeight: 600, color: '#ffffff' }}>employee@epms.com / employee123</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Styles for Animations */}
      <style>{`
        @keyframes drawStroke {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseGlow {
          from {
            opacity: 0.4;
            box-shadow: 0 0 10px 2px \${getThemeColor()};
          }
          to {
            opacity: 1;
            box-shadow: 0 0 25px 8px \${getThemeColor()};
          }
        }
        @keyframes letterReveal {
          from {
            letter-spacing: -0.1em;
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            letter-spacing: 0.4em;
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scanBar {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Login;
