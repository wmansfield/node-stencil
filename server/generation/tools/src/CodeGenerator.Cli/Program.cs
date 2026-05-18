/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

using CodeGenerator.Core;

namespace CodeGenerator.Cli;

class Program
{
    static int Main(string[] args)
    {
        try
        {
            if (args.Length == 0)
            {
                ShowUsage();
                return 0;
            }

            if (args.Length == 1)
            {
                // Single argument: treat as XML data file path
                FileInfo dataFile = new FileInfo(args[0]);
                if (!dataFile.Exists)
                {
                    Console.WriteLine($"[ERROR] Data file not found: {dataFile.FullName}");
                    return 1;
                }

                // Try to load config file for other settings
                // Check multiple locations for config file
                FileInfo configFile = null;
                string[] configPaths = {
                    "code-generator.config.xml",
                    Path.Combine(dataFile.DirectoryName ?? ".", "code-generator.config.xml"),
                    Path.Combine(Environment.CurrentDirectory, "code-generator.config.xml")
                };

                foreach (string configPath in configPaths)
                {
                    FileInfo testConfig = new FileInfo(configPath);
                    if (testConfig.Exists)
                    {
                        configFile = testConfig;
                        Console.WriteLine($"[INFO] Found config file: {configFile.FullName}");
                        break;
                    }
                }

                if (configFile != null && configFile.Exists)
                {
                    Options options = Utility.DeserializeFromXml<Options>(configFile);
                    if (options != null && !string.IsNullOrWhiteSpace(options.OutputFolder) && options.SelectedFiles.Count > 0)
                    {
                        // Resolve output folder relative to config file directory (like GUI does)
                        string outputFolderPath = options.OutputFolder;
                        if (!Path.IsPathRooted(outputFolderPath))
                        {
                            // If it's a relative path, make it relative to the config file's directory
                            outputFolderPath = Path.Combine(configFile.DirectoryName ?? ".", outputFolderPath);
                        }
                        DirectoryInfo outputFolder = new DirectoryInfo(outputFolderPath);
                        // Keep template paths as strings (like GUI does) instead of converting to FileInfo
                        string[] templatePaths = options.SelectedFiles.ToArray();
                        
                        Console.WriteLine($"[INFO] Using config settings:");
                        Console.WriteLine($"[INFO]   Output folder: {outputFolderPath}");
                        Console.WriteLine($"[INFO]   Templates: {string.Join(", ", options.SelectedFiles)}");
                        
                        // Use the data file from config (like GUI does), not the command line argument
                        FileInfo configDataFile = new FileInfo(options.DataFile);
                        GenerateCode(options.WindowsLineEndings, configDataFile, templatePaths, outputFolder, outputFolderPath);
                        return 0;
                    }
                    else
                    {
                        Console.WriteLine("[ERROR] Config file found but missing required fields (OutputFolder or SelectedFiles).");
                    }
                }
                else
                {
                    Console.WriteLine("[ERROR] No config file found in any of these locations:");
                    foreach (string configPath in configPaths)
                    {
                        Console.WriteLine($"  - {Path.GetFullPath(configPath)}");
                    }
                }

                Console.WriteLine("[ERROR] Single XML file provided, but code-generator.config.xml not found or missing required fields.");
                Console.WriteLine("Please provide output folder and template files as additional arguments.");
                ShowUsage();
                return 1;
            }

            if (args.Length < 3)
            {
                ShowUsage();
                return 1;
            }

            FileInfo dataFileArg = new FileInfo(args[0]);
            DirectoryInfo outputFolderArg = new DirectoryInfo(args[1]);
            FileInfo[] templateFilesArg = args.Skip(2).Select(arg => new FileInfo(arg)).ToArray();

            if (!dataFileArg.Exists)
            {
                Console.WriteLine($"[ERROR] Data file not found: {dataFileArg.FullName}");
                return 1;
            }

            if (!outputFolderArg.Exists)
            {
                try
                {
                    outputFolderArg.Create();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Cannot create output folder: {ex.Message}");
                    return 1;
                }
            }

            foreach (FileInfo template in templateFilesArg)
            {
                if (!template.Exists)
                {
                    Console.WriteLine($"[ERROR] Template file not found: {template.FullName}");
                    return 1;
                }
            }

            // manual invoke doesn't support advanced options for windows file endings, presume linux
            GenerateCode(false, dataFileArg, templateFilesArg, outputFolderArg);
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Unexpected error: {ex.Message}");
            return 1;
        }
    }

    static void ShowUsage()
    {
        string version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0.0";
        Console.WriteLine($"CodeGenerator CLI v{version}");
        Console.WriteLine("==================");
        Console.WriteLine("Usage: code-generator-cli <data-file> [output-folder] [template1] [template2] ...");
        Console.WriteLine("       code-generator-cli <data-file> (uses code-generator.config.xml for other settings)");
        Console.WriteLine();
        Console.WriteLine("Arguments:");
        Console.WriteLine("  data-file       XML data file to process");
        Console.WriteLine("  output-folder   Directory to write generated files (optional if using config)");
        Console.WriteLine("  template1...    XSL template files to use (optional if using config)");
        Console.WriteLine();
        Console.WriteLine("Examples:");
        Console.WriteLine("  code-generator-cli data.xml output/ template1.xsl template2.xsl");
        Console.WriteLine("  code-generator-cli data.xml (uses config for output folder and templates)");
        Console.WriteLine();
        Console.WriteLine("If only the data file is provided, the CLI will look for code-generator.config.xml");
        Console.WriteLine("in the current directory for output folder and template settings.");
    }

    static void GenerateCode(bool windowsLineEndings, FileInfo dataFile, object templates, DirectoryInfo outputFolder, string outputFolderPath = null)
    {
        string version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0.0";
        Console.WriteLine($"Code Generator CLI v{version}");
        Console.WriteLine("==================");
        Console.WriteLine($"Data file: {dataFile.FullName}");
        Console.WriteLine($"Templates: {string.Join(", ", GetTemplateNames(templates))}");
        Console.WriteLine($"Output folder: {outputFolder.FullName}");
        Console.WriteLine();

        Translator translator = new Translator();
        
        // Set up event handlers for progress reporting
        translator.Notice += (sender, e) => Console.WriteLine($"[INFO] {e.Message}");
        translator.Error += (sender, e) => Console.WriteLine($"[ERROR] {e.Message}");
        translator.Progress += (sender, e) => 
        {
            int percentage = (int)e.Progress;
            Console.Write($"\r[PROGRESS] {percentage}%");
            if (percentage >= 100)
                Console.WriteLine();
        };

        // Configure translator
        translator.DataFile = dataFile.FullName;
        translator.DataFile = dataFile.FullName;
        translator.OutputFolder = outputFolderPath ?? outputFolder.FullName; // Use string path if available, otherwise FullName
        
        // Add templates
        if (templates is FileInfo[] fileInfos)
        {
            foreach (FileInfo template in fileInfos)
            {
                translator.Templates.Add(new Template(template.Name, template.FullName, true));
            }
        }
        else if (templates is string[] templatePaths)
        {
            foreach (string templatePath in templatePaths)
            {
                string templateName = Path.GetFileName(templatePath);
                translator.Templates.Add(new Template(templateName, templatePath, true));
            }
        }

        Console.WriteLine($"[DEBUG] Added {translator.Templates.Count} templates to translator:");
        foreach (var template in translator.Templates)
        {
            Console.WriteLine($"[DEBUG]   - {template.Name} (IsSelected: {template.IsSelected})");
        }
        Console.WriteLine();

        // Generate files
        translator.GenFiles();
        
        Console.WriteLine("\nCode generation completed successfully!");
    }

    static string[] GetTemplateNames(object templates)
    {
        if (templates is FileInfo[] fileInfos)
        {
            return fileInfos.Select(t => t.Name).ToArray();
        }
        else if (templates is string[] templatePaths)
        {
            return templatePaths.Select(t => Path.GetFileName(t)).ToArray();
        }
        return new string[0];
    }
}
