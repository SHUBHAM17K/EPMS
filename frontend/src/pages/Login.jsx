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
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

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

  // High performance Canvas Particles Animation
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

    const particles = [];
    const particleCount = 45;
    const colors = ['rgba(29, 78, 216, 0.12)', 'rgba(21, 128, 61, 0.12)', 'rgba(124, 58, 237, 0.12)'];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 80 + 40;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx = Math.random() * 0.4 - 0.2;
        this.vy = Math.random() * 0.4 - 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;
      }
      draw() {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
    <div className="login-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
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
      
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>
      <div className="login-bg-shape shape-3"></div>
      
      <div className="login-card" style={{ zIndex: 1, borderTop: `4px solid ${getThemeColor()}`, transition: 'border-color 0.4s ease' }}>
        
        {/* Animated Custom Axiora Technologies Logo on Hover */}
        <div 
          onMouseEnter={() => setIsHoveredLogo(true)}
          onMouseLeave={() => setIsHoveredLogo(false)}
          style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem', 
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            background: isHoveredLogo ? 'rgba(29,78,216,0.03)' : 'transparent'
          }}
        >
          {/* Geometric Animated SVG Logo */}
          <svg 
            width="50" 
            height="50" 
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
                transform: isHoveredLogo ? 'translateY(-5px)' : 'translateY(0)'
              }}
            />
          </svg>

          <h2 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
            color: isHoveredLogo ? getThemeColor() : '#0f172a'
          }}>
            AXIORA TECHNOLOGIES
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.15rem' }}>
            Enterprise Performance Portal
          </p>
        </div>

        {/* Dynamic selector */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {['EMPLOYEE', 'MANAGER', 'ADMIN'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleSelect(role)}
              style={{
                flex: 1,
                padding: '0.4rem 0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: selectedRole === role ? getThemeColor() : 'transparent',
                color: selectedRole === role ? '#ffffff' : '#64748b',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedRole === role ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.6rem 0.8rem', 
            borderRadius: '6px', 
            fontSize: '0.8rem', 
            marginBottom: '1.25rem',
            border: '1px solid #fca5a5',
            animation: 'cardFadeIn 0.3s ease'
          }}>
            Validation Exception: {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Corporate Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@axiora.com"
              style={{ padding: '0.6rem 0.75rem' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Secure Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: '0.6rem 2.25rem 0.6rem 0.75rem' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                bottom: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#64748b'
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              padding: '0.6rem 0', 
              fontWeight: 700, 
              backgroundColor: getThemeColor(), 
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'background-color 0.4s ease'
            }}
            disabled={submitting}
          >
            {submitting ? 'Verifying Session Authorization...' : 'Authorize Access'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
            Corporate Test Accounts:
          </p>
          <div style={{ fontSize: '0.72rem', color: '#334155', fontFamily: 'monospace', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ADMIN:</span> <span style={{ fontWeight: 600 }}>admin@epms.com / admin123</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>MANAGER:</span> <span style={{ fontWeight: 600 }}>manager@epms.com / manager123</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>EMPLOYEE:</span> <span style={{ fontWeight: 600 }}>employee@epms.com / employee123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
