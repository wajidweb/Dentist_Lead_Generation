"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { apiFetch } from "../lib/api";

interface Suggestion {
  description: string;
  placeId: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CityAutocomplete({
  value,
  onChange,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Position the dropdown relative to the input
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(
        `/search/autocomplete?q=${encodeURIComponent(input)}`
      );
      const data = await res.json();
      const items = data.suggestions || [];
      setSuggestions(items);
      if (items.length > 0) {
        updateDropdownPosition();
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [updateDropdownPosition]);

  const handleInputChange = (input: string) => {
    onChange(input);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(input), 150);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const dropdown =
    isOpen && suggestions.length > 0
      ? createPortal(
          <div
            style={dropdownStyle}
            className="z-[99999] bg-white border border-[#E8E2D8] rounded-xs shadow-xl max-h-[320px] overflow-y-auto"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.placeId || idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  idx === activeIndex
                    ? "bg-[#3D8B5E]/10"
                    : "hover:bg-[#FAF8F5]"
                } ${idx > 0 ? "border-t border-[#EDE8E0]" : ""}`}
              >
                <div className="w-7 h-7 rounded-xs bg-[#FAF8F5] flex items-center justify-center shrink-0">
                  <MapPin
                    size={14}
                    className={
                      idx === activeIndex ? "text-[#3D8B5E]" : "text-[#8A9590]"
                    }
                  />
                </div>
                <span
                  className={`text-sm truncate ${
                    idx === activeIndex
                      ? "text-[#1A2E22] font-medium"
                      : "text-[#5A6B60]"
                  }`}
                >
                  {suggestion.description}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9590]">
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Search size={20} />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            updateDropdownPosition();
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search for a city... e.g. New York, Miami, London"
        required
        className="w-full border border-[#DDD8D0] rounded-xs pl-12 pr-4 py-4 text-[15px] text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 bg-[#FAF8F5] focus:bg-white transition-all"
      />
      {dropdown}
    </div>
  );
}
