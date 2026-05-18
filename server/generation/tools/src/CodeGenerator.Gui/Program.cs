/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

using System;
using System.IO;
using System.Windows.Forms;
using CodeGenerator.Core;

namespace CodeGenerator.Gui;

static class Program
{
    /// <summary>
    ///  The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main(string[] args)
    {
        // To customize application configuration such as set high DPI settings or default font,
        // see https://aka.ms/applicationconfiguration.
        ApplicationConfiguration.Initialize();
        
        MainForm mainForm = new MainForm();
        
        // If a single argument is provided, treat it as the XML data file path
        if (args.Length == 1)
        {
            string xmlFilePath = args[0];
            if (File.Exists(xmlFilePath))
            {
                mainForm.LoadXmlFile(xmlFilePath);
            }
            else
            {
                MessageBox.Show($"XML file not found: {xmlFilePath}", "File Not Found", 
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
        
        Application.Run(mainForm);
    }    
}