'use client';

/**
 * AIチャットコンポーネント
 *
 * ユーザーとAIの会話を通じて日記作成を支援する。
 * - AIが質問し、ユーザーが今日の出来事を話す
 * - 4回以上のやり取り後、「会話を日記にする」ボタンが表示される
 * - ボタンを押すとAIが会話内容から日記を生成
 * - 画像添付に対応（クリック、ドラッグ&ドロップ、ペースト）
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, SummarizeResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Send, Loader2, Sparkles, Check, X, ImagePlus } from 'lucide-react';

/** 画像アイテムの型 */
interface ImageItem {
  url: string;      // サーバーに保存されたURL
  preview: string;  // プレビュー用のData URL
}

/** コンポーネントのプロパティ */
interface AIChatProps {
  /** 日記生成完了時のコールバック（タイトル、本文、画像URLを受け取る） */
  onComplete: (title: string, content: string, imageUrls: string[]) => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

/** ファイルサイズ上限（MB） */
const MAX_FILE_SIZE_MB = 50;
/** 対応している画像形式 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'image/svg+xml'];

// 初回メッセージ（API呼び出し不要）
const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'こんにちは！日記をつけるお手伝いをしますね。\n\n今日はどんな一日でしたか？'
};

export function AIChat({ onComplete, onCancel }: AIChatProps) {
  // 会話履歴（初回メッセージで初期化）
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  // ユーザーの入力テキスト
  const [input, setInput] = useState('');
  // AI応答待ち状態
  const [loading, setLoading] = useState(false);
  // 「日記にする」ボタン表示フラグ（4回以上のやり取り後にtrue）
  const [shouldSummarize, setShouldSummarize] = useState(false);
  // 要約生成中フラグ
  const [summarizing, setSummarizing] = useState(false);
  // スクロール用の参照
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 画像関連の状態
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** ファイルサイズと形式のバリデーション */
  const validateFile = (file: File): string | null => {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `ファイルサイズが大きすぎます。上限: ${MAX_FILE_SIZE_MB}MB`;
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return '対応していないファイル形式です。対応形式: JPG, PNG, GIF, WebP, BMP, TIFF, HEIC, SVG';
    }
    return null;
  };

  /** 複数ファイルをアップロード */
  const uploadFiles = useCallback(async (files: File[]) => {
    setUploadError(null);

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        continue;
      }

      // プレビュー作成
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // アップロード
      setUploading(true);
      try {
        const result = await api.uploadImage(file);
        setImages((prev) => [...prev, { url: result.url, preview }]);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
      } finally {
        setUploading(false);
      }
    }
  }, []);

  /** 画像選択ハンドラ */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** 画像削除ハンドラ */
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /** ドラッグイベントハンドラ */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  /** ペーストハンドラ（画像貼り付け対応） */
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (imageFiles.length > 0) {
      e.preventDefault();
      await uploadFiles(imageFiles);
    }
  };

  /** メッセージ追加時に最下部へスクロール */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /** メッセージ送信処理 */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post<{ message: ChatMessage; should_summarize: boolean }>(
        '/api/v1/chat/message',
        { messages: newMessages }
      );
      setMessages([...newMessages, response.message]);
      setShouldSummarize(response.should_summarize);
    } catch (error) {
      console.error('Failed to send message:', error);
      // エラーメッセージを取得（バックエンドからのメッセージを優先）
      const errorMessage = error instanceof Error ? error.message : '';
      const isRateLimit = errorMessage.includes('レート制限') || errorMessage.includes('429');

      setMessages([...newMessages, {
        role: 'assistant',
        content: isRateLimit
          ? '⚠️ AI APIのレート制限に達しました。\n\nしばらく時間をおいてから再度お試しください。\n（毎日午前9時にリセットされます）'
          : 'エラーが発生しました。もう一度お試しください。'
      }]);
    } finally {
      setLoading(false);
    }
  };

  /** キーボードイベント処理（Enterで送信） */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中（日本語入力中）は送信しない
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  /** 会話内容を日記に要約する処理 */
  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const response = await api.post<SummarizeResponse>(
        '/api/v1/chat/summarize',
        { messages }
      );
      // 画像URLの配列も一緒に渡す
      const imageUrls = images.map((img) => img.url);
      onComplete(response.title, response.content, imageUrls);
    } catch (error) {
      console.error('Failed to summarize:', error);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <Card
      className={`flex flex-col h-[600px] ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AIと会話して日記を作成
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 pb-0">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="flex-col gap-3 pt-3">
        {/* 画像プレビュー */}
        {images.length > 0 && (
          <div className="flex w-full gap-2 overflow-x-auto py-2">
            {images.map((img, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={img.preview}
                  alt={`Image ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5"
                  onClick={() => handleRemoveImage(index)}
                  disabled={uploading || summarizing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* アップロードエラー表示 */}
        {uploadError && (
          <p className="text-sm text-red-500 w-full">{uploadError}</p>
        )}

        {/* アップロード中表示 */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
            <Loader2 className="h-4 w-4 animate-spin" />
            アップロード中...
          </div>
        )}

        {/* 入力エリア */}
        <div className="flex w-full gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || summarizing}
            title="画像を追加"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="メッセージを入力..."
            disabled={loading || summarizing}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading || summarizing}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* ドラッグ中のヒント */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-lg">
            <p className="text-primary font-medium">ここにドロップして画像を追加</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex w-full gap-2">
          {shouldSummarize && (
            <Button
              onClick={handleSummarize}
              disabled={summarizing || uploading}
              className="flex-1"
              variant="default"
            >
              {summarizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  日記を作成中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  会話を日記にする
                  {images.length > 0 && ` (${images.length}枚の画像)`}
                </>
              )}
            </Button>
          )}
          <Button
            onClick={onCancel}
            variant="outline"
            className={shouldSummarize ? '' : 'flex-1'}
            disabled={summarizing}
          >
            <X className="h-4 w-4 mr-2" />
            キャンセル
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
