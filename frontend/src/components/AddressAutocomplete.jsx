import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

// Helper to generate UUID for Google Places API Session Tokens
const generateSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const AddressAutocomplete = ({ 
  initialAddress = '', 
  placeholder = 'Type building or landmark name (e.g. Park Ridge Apartments Guntur)...',
  onSelectAddress,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Selected Building Metadata
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  // User GPS coordinates for search biasing
  const [userLocation, setUserLocation] = useState(null);
  
  // Session token for Google Places API billing bundling
  const sessionTokenRef = useRef(generateSessionToken());
  const debounceTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Prefill initial address if provided
  useEffect(() => {
    setInputValue(initialAddress || '');
  }, [initialAddress]);

  // Request user GPS location for local search biasing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Silently fallback if GPS is not available or blocked
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- STEP 1: Autocomplete Fetch with 300ms Debounce ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedBuilding(null); // Clear selected pin when typing

    if (onSelectAddress) {
      onSelectAddress({ address: value });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value || !value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        let queryUrl = `${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(value.trim())}&sessionToken=${sessionTokenRef.current}`;
        
        if (userLocation) {
          queryUrl += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const response = await fetch(queryUrl);
        const data = await response.json();

        if (response.ok && data.suggestions) {
          setSuggestions(data.suggestions);
          setShowDropdown(data.suggestions.length > 0);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms Debounce
  };

  // --- STEP 2: Place Details Fetch (Rooftop Coordinate Extraction) ---
  const handleSelectSuggestion = async (suggestion) => {
    setShowDropdown(false);
    setIsLoading(true);
    setInputValue(suggestion.description || suggestion.main_text);

    try {
      // Pass place_id and sessionToken into details endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/places/details?place_id=${encodeURIComponent(suggestion.place_id)}&sessionToken=${sessionTokenRef.current}`
      );
      
      const details = await response.json();

      if (response.ok) {
        const buildingData = {
          full_address: details.full_address || suggestion.description,
          building_name: details.building_name || suggestion.main_text,
          latitude: details.latitude,
          longitude: details.longitude
        };

        setSelectedBuilding(buildingData);
        setInputValue(buildingData.full_address);

        // Notify parent component with building name, address, and rooftop coordinates
        if (onSelectAddress) {
          onSelectAddress({
            address: buildingData.full_address,
            buildingName: buildingData.building_name,
            latitude: buildingData.latitude,
            longitude: buildingData.longitude
          });
        }
      }
    } catch (err) {
      console.error('Details fetch error:', err);
    } finally {
      setIsLoading(false);
      // Reset session token after a completed place selection session
      sessionTokenRef.current = generateSessionToken();
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          color: selectedBuilding ? 'var(--primary-color)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        <input
          type="text"
          className="form-input"
          style={{
            paddingLeft: '2.4rem',
            paddingRight: isLoading ? '2.4rem' : '1rem',
            width: '100%',
            borderColor: selectedBuilding ? 'var(--secondary-success)' : undefined
          }}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          disabled={disabled}
        />

        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            width: '16px',
            height: '16px',
            border: '2px solid #E2E8F0',
            borderTop: '2px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 100,
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            backgroundColor: '#FAFAFA',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: '600'
          }}>
            Google Places Building Suggestions
          </div>

          {suggestions.map((item) => (
            <div
              key={item.place_id}
              onClick={() => handleSelectSuggestion(item)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #F0F4F8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF5F2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              <div style={{ marginTop: '2px', color: 'var(--primary-color)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <line x1="8" y1="6" x2="8.01" y2="6" />
                  <line x1="16" y1="6" x2="16.01" y2="6" />
                  <line x1="12" y1="6" x2="12.01" y2="6" />
                  <line x1="12" y1="10" x2="12.01" y2="10" />
                  <line x1="12" y1="14" x2="12.01" y2="14" />
                </svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {item.main_text}
                </span>
                {item.secondary_text && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {item.secondary_text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rooftop Pin Confirmation Badge */}
      {selectedBuilding && (
        <div style={{
          marginTop: '0.5rem',
          backgroundColor: '#E6F4EA',
          border: '1px solid #A8DADC',
          padding: '0.4rem 0.75rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#1B4332'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.9rem' }}>📍</span>
            <span style={{ fontWeight: '600' }}>
              Building Rooftop Pin: [{selectedBuilding.latitude.toFixed(4)}, {selectedBuilding.longitude.toFixed(4)}]
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#2D6A4F', fontStyle: 'italic' }}>
            Exact Building Locked
          </span>
        </div>
      )}
    </div>
  );
};
