import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Monitor } from "lucide-react";

declare global {
  interface Window {
    Blockly: any;
    appendToPreview: (text: string) => void;
  }
}

export default function Home() {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [previewContent, setPreviewContent] = useState<Array<{id: string, text: string, timestamp: string}>>([]);

  useEffect(() => {
    // Wait for Blockly to be loaded
    const initBlockly = () => {
      if (!window.Blockly || !blocklyDivRef.current) {
        setTimeout(initBlockly, 100);
        return;
      }

      // Custom print block definition
      window.Blockly.Blocks['text_print'] = {
        init: function() {
          this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("print");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(160);
          this.setTooltip("Print text to preview panel");
          this.setHelpUrl("");
        }
      };

      // JavaScript generator for print block
      window.Blockly.JavaScript['text_print'] = function(block: any) {
        var value_text = window.Blockly.JavaScript.valueToCode(block, 'TEXT', window.Blockly.JavaScript.ORDER_ATOMIC);
        if (!value_text) {
          value_text = '""';
        }
        var code = 'window.appendToPreview(' + value_text + ');\n';
        return code;
      };

      // Initialize workspace
      workspaceRef.current = window.Blockly.inject(blocklyDivRef.current, {
        toolbox: getToolboxXml(),
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true
        },
        trashcan: true,
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        }
      });

      // Add initial example block
      addInitialBlock();
    };

    // Define global function for preview output
    window.appendToPreview = (text: string) => {
      const id = Date.now().toString();
      const timestamp = new Date().toLocaleTimeString();
      setPreviewContent(prev => [...prev, { id, text: text || '', timestamp }]);
    };

    initBlockly();

    // Handle window resize
    const handleResize = () => {
      if (workspaceRef.current) {
        window.Blockly.svgResize(workspaceRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getToolboxXml = () => {
    return `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <category name="Logic" colour="#5C7CFA">
          <block type="controls_if"></block>
          <block type="logic_compare"></block>
          <block type="logic_operation"></block>
          <block type="logic_negate"></block>
          <block type="logic_boolean"></block>
        </category>
        <category name="Loops" colour="#5BB469">
          <block type="controls_repeat_ext"></block>
          <block type="controls_whileUntil"></block>
          <block type="controls_for"></block>
        </category>
        <category name="Math" colour="#5BA4B0">
          <block type="math_number"></block>
          <block type="math_arithmetic"></block>
          <block type="math_single"></block>
          <block type="math_trig"></block>
          <block type="math_constant"></block>
        </category>
        <category name="Text" colour="#5BA58C">
          <block type="text"></block>
          <block type="text_print"></block>
          <block type="text_join"></block>
          <block type="text_append"></block>
          <block type="text_length"></block>
          <block type="text_isEmpty"></block>
        </category>
        <category name="Variables" colour="#A55B80" custom="VARIABLE"></category>
        <category name="Functions" colour="#9A5BA5" custom="PROCEDURE"></category>
      </xml>
    `;
  };

  const addInitialBlock = () => {
    if (!workspaceRef.current || !window.Blockly) return;

    try {
      // Create the initial block programmatically
      const printBlock = workspaceRef.current.newBlock('text_print');
      printBlock.moveBy(50, 50);
      
      const textBlock = workspaceRef.current.newBlock('text');
      textBlock.setFieldValue('Halo Dunia', 'TEXT');
      
      // Connect the blocks
      const textOutput = textBlock.outputConnection;
      const printInput = printBlock.getInput('TEXT').connection;
      textOutput.connect(printInput);
      
      // Initialize the blocks
      printBlock.initSvg();
      textBlock.initSvg();
      printBlock.render();
      textBlock.render();
    } catch (error) {
      console.log('Could not add initial block:', error);
    }
  };

  const handleRun = async () => {
    if (isRunning || !workspaceRef.current) return;

    setIsRunning(true);

    try {
      // Generate JavaScript code from Blockly workspace
      const code = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      
      console.log('Generated code:', code); // Debug log
      console.log('Current preview content length:', previewContent.length);
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!code.trim()) {
        window.appendToPreview('Program kosong - tidak ada blok untuk dijalankan');
      } else {
        const currentLength = previewContent.length;
        console.log('About to execute code:', code);
        
        // Execute the generated code
        eval(code);
        
        // Check if output was generated after a short delay
        setTimeout(() => {
          if (previewContent.length === currentLength) {
            window.appendToPreview('Program selesai dijalankan (tidak ada output)');
          }
        }, 50);
      }
    } catch (error: any) {
      console.error('Error executing code:', error);
      window.appendToPreview('Error: ' + error.message);
    }

    // Reset button state
    setTimeout(() => {
      setIsRunning(false);
    }, 1000);
  };

  const handleReset = () => {
    setPreviewContent([]);
  };

  return (
    <div className="h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-slate-800">Blockly Educational Playground</h1>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Playground</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRun}
              disabled={isRunning}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Menjalankan...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Jalankan
                </>
              )}
            </Button>
            <Button 
              onClick={handleReset}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-80px)]">
        {/* Blockly Workspace */}
        <div className="flex-1 bg-white border-r border-slate-200 shadow-sm">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-medium text-slate-700">Workspace Blockly</h2>
              <p className="text-xs text-slate-500 mt-1">Drag dan susun blok untuk membuat program</p>
            </div>
            <div ref={blocklyDivRef} className="flex-1" />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-2/5 bg-white shadow-sm">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-medium text-slate-700">Panel Preview</h2>
              <p className="text-xs text-slate-500 mt-1">Hasil eksekusi kode akan ditampilkan di sini</p>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {previewContent.length === 0 ? (
                <div className="text-center text-slate-400 mt-8">
                  <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Klik "Jalankan" untuk melihat hasil program</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {previewContent.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="font-mono text-sm text-slate-800">{item.text}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
