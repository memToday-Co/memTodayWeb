import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
}

type GameState = "selecting" | "memorizing" | "typing" | "results";

const MemorizeQuote = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [gameState, setGameState] = useState<GameState>("selecting");
  const [timeLeft, setTimeLeft] = useState(10);
  const [userInput, setUserInput] = useState("");
  const [accuracy, setAccuracy] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "memorizing" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (gameState === "memorizing" && timeLeft === 0) {
      setGameState("typing");
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startMemorizing = (quote: Quote) => {
    setSelectedQuote(quote);
    setGameState("memorizing");
    setTimeLeft(10);
    setUserInput("");
    setAccuracy(0);
  };

  const calculateAccuracy = (original: string, input: string) => {
    const originalWords = original.toLowerCase().split(/\s+/);
    const inputWords = input.toLowerCase().split(/\s+/);

    let correctWords = 0;
    const maxLength = Math.max(originalWords.length, inputWords.length);

    for (let i = 0; i < maxLength; i++) {
      if (
        originalWords[i] &&
        inputWords[i] &&
        originalWords[i] === inputWords[i]
      ) {
        correctWords++;
      }
    }

    return Math.round((correctWords / originalWords.length) * 100);
  };

  const submitAttempt = async () => {
    if (!selectedQuote) return;

    const calculatedAccuracy = calculateAccuracy(selectedQuote.text, userInput);
    setAccuracy(calculatedAccuracy);

    try {
      await supabase.from("quote_attempts").insert({
        quote_id: selectedQuote.id,
        user_id: user?.id,
        user_input: userInput,
        accuracy_percentage: calculatedAccuracy,
      });
    } catch (error) {
      console.error("Error saving attempt:", error);
    }

    setGameState("results");
  };

  const resetGame = () => {
    setSelectedQuote(null);
    setGameState("selecting");
    setUserInput("");
    setAccuracy(0);
    setTimeLeft(10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading quotes...</div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quotes to memorize
          </h3>
          <p className="text-gray-600 text-center">
            Create some quotes first to start practicing memorization.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "selecting") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Choose a Quote to Memorize
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <Card
              key={quote.id}
              className="bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => startMemorizing(quote)}
            >
              <CardContent className="p-4">
                <blockquote className="text-gray-800 mb-3 italic text-sm">
                  &quot;
                  {quote.text.length > 100
                    ? quote.text.substring(0, 100) + "..."
                    : quote.text}
                  &quot;
                </blockquote>
                {quote.author && (
                  <p className="text-sm text-gray-600 mb-2">— {quote.author}</p>
                )}
                {quote.category && (
                  <Badge variant="outline" className="text-xs">
                    {quote.category}
                  </Badge>
                )}
                <Button className="w-full mt-3" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  Start Memorizing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === "memorizing") {
    return (
      <Card className="max-w-2xl mx-auto bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Memorize This Quote
            </span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {timeLeft}s
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={(10 - timeLeft) * 10} className="w-full" />
          <div className="text-center p-8 bg-blue-50 rounded-lg">
            <blockquote className="text-xl text-gray-800 italic leading-relaxed">
              &quot;{selectedQuote?.text}&quot;
            </blockquote>
            {selectedQuote?.author && (
              <p className="text-lg text-gray-600 mt-4">
                — {selectedQuote.author}
              </p>
            )}
          </div>
          <p className="text-center text-gray-600">
            Study this quote carefully. You'll need to type it from memory when
            the timer runs out.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "typing") {
    return (
      <Card className="max-w-2xl mx-auto bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Type the Quote from Memory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Now type the quote you just memorized. Try to be as accurate as
              possible!
            </p>
            {selectedQuote?.author && (
              <p className="text-sm text-gray-500 mt-2">
                Author: {selectedQuote.author}
              </p>
            )}
          </div>
          <Textarea
            placeholder="Type the quote here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={6}
            className="resize-none text-lg"
          />
          <div className="flex gap-3">
            <Button
              onClick={submitAttempt}
              className="flex-1"
              disabled={!userInput.trim()}
            >
              Submit Answer
            </Button>
            <Button variant="outline" onClick={resetGame}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "results") {
    return (
      <Card className="max-w-2xl mx-auto bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {accuracy >= 80 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div
              className={`text-4xl font-bold mb-2 ${
                accuracy >= 80
                  ? "text-green-500"
                  : accuracy >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {accuracy}%
            </div>
            <p className="text-gray-600">
              {accuracy >= 80
                ? "Excellent!"
                : accuracy >= 60
                  ? "Good job!"
                  : "Keep practicing!"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Original Quote:
              </h4>
              <div className="p-3 bg-green-50 rounded-lg">
                <blockquote className="italic">
                  &quot;{selectedQuote?.text}&quot;
                </blockquote>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <blockquote className="italic">
                  &quot;{userInput}&quot;
                </blockquote>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => startMemorizing(selectedQuote!)}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button variant="outline" onClick={resetGame}>
              Choose Another Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default MemorizeQuote;
