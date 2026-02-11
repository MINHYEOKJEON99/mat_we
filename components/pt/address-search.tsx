"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
      }) => {
        embed: (element: HTMLElement) => void;
        open: () => void;
      };
    };
  }
}

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sigungu: string;
  bname: string;
  userSelectedType: "R" | "J";
}

interface AddressSearchProps {
  value: string;
  detailValue?: string;
  onChange: (address: string) => void;
  onDetailChange?: (detail: string) => void;
  placeholder?: string;
}

export function AddressSearch({
  value,
  detailValue = "",
  onChange,
  onDetailChange,
  placeholder = "주소를 검색하세요",
}: AddressSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  // Load Daum Postcode script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.daum?.Postcode) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else if (window.daum?.Postcode) {
      setIsScriptLoaded(true);
    }
  }, []);

  // Initialize Postcode when modal opens
  useEffect(() => {
    if (isOpen && isScriptLoaded && layerRef.current && window.daum?.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

          const fullAddress = data.buildingName ? `${address} (${data.buildingName})` : address;

          onChange(fullAddress);
          setIsOpen(false);
        },
        onclose: () => setIsOpen(false),
        width: "100%",
        height: "100%",
      }).embed(layerRef.current);
    }
  }, [isOpen, isScriptLoaded, onChange]);

  const handleOpenSearch = () => {
    if (!isScriptLoaded) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange("");
    onDetailChange?.("");
  };

  return (
    <div className="space-y-3">
      {/* Address Display / Search Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpenSearch}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all text-left",
            value
              ? "border-slate-300 bg-slate-50 hover:bg-slate-100"
              : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
          )}>
          <div className={cn("p-2 rounded-lg", value ? "bg-slate-200" : "bg-slate-100")}>
            <MapPin className={cn("h-5 w-5", value ? "text-slate-700" : "text-slate-400")} />
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <div>
                <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
                <p className="text-xs text-slate-500">클릭하여 주소 변경</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500">{placeholder}</p>
                <p className="text-xs text-slate-400">도로명 또는 지번 주소로 검색</p>
              </div>
            )}
          </div>
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Detail Address Input */}
      {value && onDetailChange && (
        <Input
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder="상세 주소를 입력하세요 (동/호수 등)"
          className="h-12"
        />
      )}

      {/* Address Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">주소 검색</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Daum Postcode Embed Container */}
            <div ref={layerRef} className="w-full" style={{ height: "450px" }} />
          </div>
        </div>
      )}
    </div>
  );
}
